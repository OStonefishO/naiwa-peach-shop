/**
 * 奶蛙黄桃罐头店 · 安卓 APK 手工构建脚本（不依赖 Gradle）
 * 链路：aapt2 compile/link → 修正 assets 路径 → javac → d8 → 塞 classes.dex → zipalign → apksigner
 *
 * 注意：aapt2 对中文路径不友好，因此所有编译动作都在 ASCII 暂存目录（C:\naiwa_apk_build）内进行，
 * android.jar 也复制一份到该目录；签名密钥固定在 C:\naiwa_apk_keys。
 *
 * 用法： node android/build-apk.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.resolve(__dirname);
const WORK = process.env.NAIWA_BUILD_DIR || 'C:\\naiwa_apk_build';
const KEY_DIR = 'C:\\naiwa_apk_keys';
const SDK = process.env.ANDROID_SDK_ROOT || 'D:\\文件\\_android_sdk';
const TOOLCHAIN = 'D:\\文件\\_android_toolchain';

const BT_VERSION = process.env.BT_VERSION || '34.0.0';
const OUT_DIR = path.join(ANDROID, 'out');
const KEYSTORE = path.join(KEY_DIR, 'naiwa-release.jks');
const KS_PASS = 'naiwa2026';
const KS_ALIAS = 'naiwa';

const SDK_ANDROID_JAR = path.join(SDK, 'platforms', 'android-34', 'android.jar');
const BUILD_TOOLS = path.join(SDK, 'build-tools', BT_VERSION);
const AAPT2 = path.join(BUILD_TOOLS, 'aapt2.exe');
const ZIPALIGN = path.join(BUILD_TOOLS, 'zipalign.exe');
const D8 = path.join(BUILD_TOOLS, 'd8.bat');
const APKSIGNER = path.join(BUILD_TOOLS, 'apksigner.bat');

// 版本号的唯一来源：src/v2.html 的 <title>...正式版 X.Y</title>
// versionCode 规则：主版本 * 100 + 次版本（4.71 → 471，5.0 → 500），保证永远递增。
function readVersion() {
  const html = fs.readFileSync(path.join(ROOT, 'src', 'v2.html'), 'utf8');
  const m = html.match(/正式版\s*([\d.]+)/);
  if (!m) fail('src/v2.html 的标题里找不到「正式版 X.Y」版本号');
  const version = m[1];
  const parts = version.split('.');
  const versionCode = parseInt(parts[0], 10) * 100 + parseInt(parts[1] || '0', 10);
  return { version, versionCode };
}
const { version: VERSION, versionCode: VERSION_CODE } = readVersion();
const APK_NAME = `naiwa-peach-shop-${VERSION}.apk`;

function log(msg) { console.log(`[build] ${msg}`); }
function fail(msg) { console.error(`[build] !! ${msg}`); process.exit(1); }
function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }
function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

function findJDK() {
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', 'javac.exe'))) {
    return process.env.JAVA_HOME;
  }
  if (!fs.existsSync(TOOLCHAIN)) return null;
  for (const name of fs.readdirSync(TOOLCHAIN)) {
    const d = path.join(TOOLCHAIN, name);
    if (fs.statSync(d).isDirectory() && fs.existsSync(path.join(d, 'bin', 'javac.exe'))) return d;
  }
  return null;
}

const JDK = findJDK();
if (!JDK) fail('找不到 JDK（需要 javac）。请把 JDK 解压到 ' + TOOLCHAIN);
const JAVA_HOME_BIN = path.join(JDK, 'bin');
const exe = (n) => path.join(JAVA_HOME_BIN, n + '.exe');
const JAVA_ENV = { ...process.env, JAVA_HOME: JDK, PATH: `${JAVA_HOME_BIN};${process.env.PATH}` };

if (!fs.existsSync(BUILD_TOOLS)) fail('缺少 build-tools：' + BUILD_TOOLS);
if (!fs.existsSync(SDK_ANDROID_JAR)) fail('缺少 android.jar：' + SDK_ANDROID_JAR);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (out) console.log(out.split('\n').slice(-40).join('\n'));
  if (r.status !== 0) fail(`命令失败(${r.status}): ${path.basename(cmd)} ${args.join(' ')}`);
  return out;
}

function runShell(cmdLine, opts = {}) {
  const r = spawnSync(cmdLine, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true, ...opts });
  const out = `${r.stdout || ''}${r.stderr || ''}`.trim();
  if (out) console.log(out.split('\n').slice(-40).join('\n'));
  if (r.status !== 0) fail(`命令失败(${r.status}): ${cmdLine}`);
  return out;
}

function quote(p) { return `"${p}"`; }

function copyDir(src, dst) {
  mkdirp(dst);
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// aapt2 在 Windows 上会把 assets 子目录分隔符写成反斜杠（assets/music\title.mp3），Android 运行时期望正斜杠。
// 这里直接在字节层面把 'assets/music\' 就地改成 'assets/music/'：替换前后长度相同，zip 的偏移、CRC、
// 压缩方法全部保持不变，因此 resources.arsc 仍然是 STORED（不会被重新压缩）。
// 走「重写整个 zip」的方案会把 arsc 变成 DEFLATE，导致 targetSdk>=30 设备安装失败：
//   Failure [-124: Failed parse during installPackageLI: Targeting R+ (version 30 and above) requires
//   the resources.arsc of installed APKs to be stored uncompressed and aligned on a 4-byte boundary]
function fixAssetPaths(apkIn, apkOut) {
  const buf = fs.readFileSync(apkIn);
  const out = Buffer.from(buf);
  const pairs = [
    [Buffer.from('assets/music\\'), Buffer.from('assets/music/')],
    [Buffer.from('assets\\music\\'), Buffer.from('assets/music/')],
  ];
  let count = 0;
  for (const [needle, repl] of pairs) {
    let idx = 0;
    while ((idx = out.indexOf(needle, idx)) !== -1) {
      repl.copy(out, idx);
      count += 1;
      idx += needle.length;
    }
  }
  if (count === 0) fail('未找到需要修正的 assets 反斜杠路径（aapt2 行为可能已变化）');
  fs.writeFileSync(apkOut, out);
  console.log(`asset paths normalized: ${count} 处`);
}

log('JDK      : ' + JDK);
log('SDK      : ' + SDK);
log('build-tls: ' + BUILD_TOOLS);
log('work dir : ' + WORK);

rmrf(WORK);
mkdirp(WORK);
mkdirp(OUT_DIR);
mkdirp(KEY_DIR);

// android.jar 复制到 ASCII 路径，规避 aapt2 的中文路径问题
const ANDROID_JAR = path.join(WORK, 'android.jar');
fs.copyFileSync(SDK_ANDROID_JAR, ANDROID_JAR);

// ---------- 1. 暂存源码（ASCII 路径） ----------
const SRC = path.join(WORK, 'src');
copyDir(path.join(ANDROID, 'app', 'src', 'main', 'java'), path.join(SRC, 'java'));
copyDir(path.join(ANDROID, 'app', 'src', 'main', 'res'), path.join(SRC, 'res'));
fs.copyFileSync(path.join(ANDROID, 'app', 'src', 'main', 'AndroidManifest.xml'), path.join(SRC, 'AndroidManifest.xml'));

// ---------- 2. 同步游戏资源到 assets ----------
const GAME_DIR = path.join(ROOT, 'wechat-qq');
const GAME_HTML = path.join(GAME_DIR, 'index.html');
if (!fs.existsSync(GAME_HTML)) fail('缺少游戏构建产物：' + GAME_HTML + '（先运行 node src/build.cjs）');
const ASSETS = path.join(WORK, 'assets');
mkdirp(ASSETS);
fs.copyFileSync(GAME_HTML, path.join(ASSETS, 'index.html'));
const musicSrc = path.join(GAME_DIR, 'music');
if (!fs.existsSync(musicSrc)) fail('缺少音乐目录：' + musicSrc);
copyDir(musicSrc, path.join(ASSETS, 'music'));
{
  let total = 0;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else total += fs.statSync(p).size;
    }
  })(ASSETS);
  log(`assets 同步完成：${(total / 1024 / 1024).toFixed(2)} MB`);
}

// ---------- 3. aapt2 ----------
const compiledRes = path.join(WORK, 'compiled-res.zip');
log('aapt2 compile ...');
run(AAPT2, ['compile', '--dir', path.join(SRC, 'res'), '-o', compiledRes]);

const unalignedApk = path.join(WORK, 'base-unaligned.apk');
const genDir = path.join(WORK, 'gen');
mkdirp(genDir);
log('aapt2 link ...');
run(AAPT2, [
  'link',
  '-o', unalignedApk,
  '-I', ANDROID_JAR,
  '--manifest', path.join(SRC, 'AndroidManifest.xml'),
  '-A', ASSETS,
  '--java', genDir,
  '--min-sdk-version', '24',
  '--target-sdk-version', '34',
  '--version-code', String(VERSION_CODE),
  '--version-name', VERSION,
  '--auto-add-overlay',
  compiledRes,
]);

const normalizedApk = path.join(WORK, 'base-normalized.apk');
log('修正 assets 路径分隔符 ...');
fixAssetPaths(unalignedApk, normalizedApk);

// ---------- 4. javac ----------
const classesDir = path.join(WORK, 'classes');
mkdirp(classesDir);
const javaFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.java')) javaFiles.push(p);
  }
})(path.join(SRC, 'java'));
// aapt2 link --java 生成的 R.java（布局/图标等资源 id）
(function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.java')) javaFiles.push(p);
  }
})(genDir);
log(`javac：${javaFiles.length} 个源文件 ...`);
run(exe('javac'), [
  '-encoding', 'UTF-8',
  '-source', '8', '-target', '8',
  '-bootclasspath', ANDROID_JAR,
  '-classpath', ANDROID_JAR,
  '-d', classesDir,
  ...javaFiles,
]);

// ---------- 5. d8 → classes.dex ----------
const dexDir = path.join(WORK, 'dex');
mkdirp(dexDir);
const classFiles = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.class')) classFiles.push(p);
  }
})(classesDir);
log(`d8：${classFiles.length} 个 class ...`);
runShell([
  quote(D8),
  '--release', '--min-api', '24',
  '--lib', quote(ANDROID_JAR),
  '--output', quote(dexDir),
  ...classFiles.map(quote),
].join(' '), { env: JAVA_ENV });

// ---------- 6. 把 classes.dex 塞进 APK ----------
log('打包 classes.dex ...');
const withDex = path.join(WORK, 'base-dex.apk');
{
  const dexPath = path.join(WORK, 'classes.dex');
  fs.copyFileSync(path.join(dexDir, 'classes.dex'), dexPath);
  fs.copyFileSync(normalizedApk, withDex);
  const ps = [
    // 注意：Windows PowerShell 5.1 只加载 FileSystem 时认不出 ZipArchiveMode 枚举，
    // 必须先加载 System.IO.Compression，否则会静默失败、classes.dex 不会被打进 APK。
    'Add-Type -AssemblyName System.IO.Compression',
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    '$ErrorActionPreference = "Stop"',
    '$zip = [System.IO.Compression.ZipFile]::Open($env:APK_PATH, [System.IO.Compression.ZipArchiveMode]::Update)',
    '$entry = $zip.CreateEntry("classes.dex", [System.IO.Compression.CompressionLevel]::Optimal)',
    '$stream = $entry.Open()',
    '$bytes = [System.IO.File]::ReadAllBytes($env:DEX_PATH)',
    '$stream.Write($bytes, 0, $bytes.Length)',
    '$stream.Close()',
    '$zip.Dispose()',
    'Write-Output "classes.dex appended"',
  ].join('; ');
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    encoding: 'utf8',
    env: { ...process.env, APK_PATH: withDex, DEX_PATH: dexPath },
  });
  if (r.status !== 0) fail('写入 classes.dex 失败：' + (r.stderr || r.stdout));
  console.log((r.stdout || '').trim());
}

// ---------- 7. 签名 ----------
if (!fs.existsSync(KEYSTORE)) {
  log('生成签名密钥 ...');
  run(exe('keytool'), [
    '-genkeypair', '-v',
    '-keystore', KEYSTORE,
    '-alias', KS_ALIAS,
    '-storepass', KS_PASS,
    '-keypass', KS_PASS,
    '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
    '-dname', 'CN=Naiwa Peach Shop, O=Naiwa, L=China, C=CN',
  ]);
}

const alignedApk = path.join(WORK, 'base-aligned.apk');
log('zipalign ...');
run(ZIPALIGN, ['-f', '-p', '4', withDex, alignedApk]);

const signedApk = path.join(WORK, APK_NAME);
log('apksigner ...');
runShell([
  quote(APKSIGNER), 'sign',
  '--ks', quote(KEYSTORE),
  '--ks-key-alias', KS_ALIAS,
  '--ks-pass', `pass:${KS_PASS}`,
  '--key-pass', `pass:${KS_PASS}`,
  '--min-sdk-version', '24',
  '--out', quote(signedApk),
  quote(alignedApk),
].join(' '), { env: JAVA_ENV });

const verify = runShell([quote(APKSIGNER), 'verify', '--print-certs', quote(signedApk)].join(' '), { env: JAVA_ENV });
console.log(verify);

const finalApk = path.join(OUT_DIR, APK_NAME);
if (fs.existsSync(finalApk)) fs.rmSync(finalApk);
fs.copyFileSync(signedApk, finalApk);

// 同时放一份到仓库根的 dist/，GitHub Release 工作流会把它挂到 Release 上。
{
  const distDir = path.join(ROOT, 'dist');
  mkdirp(distDir);
  for (const old of fs.readdirSync(distDir)) {
    if (/^naiwa-peach-shop-.*\.apk$/.test(old) && old !== APK_NAME) fs.rmSync(path.join(distDir, old));
  }
  fs.copyFileSync(signedApk, path.join(distDir, APK_NAME));
  log('dist 归档：dist/' + APK_NAME);
}

// ---------- 8. 产物自检（防止再次出现「静默丢 classes.dex」「arsc 被压缩导致装不上」） ----------
{
  const psCheck = [
    'Add-Type -AssemblyName System.IO.Compression',
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    '$ErrorActionPreference = "Stop"',
    '$zip = [System.IO.Compression.ZipFile]::OpenRead($env:APK_PATH)',
    'foreach ($e in $zip.Entries) {',
    '  $tag = if ($e.CompressedLength -eq $e.Length) { "STORED:" } else { "" }',
    '  Write-Output ($tag + $e.FullName)',
    '}',
    '$zip.Dispose()',
  ].join('; ');
  const r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCheck], {
    encoding: 'utf8',
    env: { ...process.env, APK_PATH: finalApk },
  });
  if (r.status !== 0) fail('读取 APK 条目失败：' + (r.stderr || r.stdout));
  const raw = (r.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const stored = new Set(raw.filter((s) => s.startsWith('STORED:')).map((s) => s.slice(7)));
  const entries = raw.map((s) => (s.startsWith('STORED:') ? s.slice(7) : s));
  const must = ['AndroidManifest.xml', 'classes.dex', 'resources.arsc', 'assets/index.html'];
  const missing = must.filter((m) => !entries.includes(m));
  if (missing.length) fail('APK 缺少必需条目：' + missing.join(', '));
  if (!stored.has('resources.arsc')) {
    fail('resources.arsc 必须未压缩存储，否则 targetSdk>=30 无法安装');
  }
  if (!entries.some((e) => /^assets\/music\/.+\.mp3$/.test(e))) fail('APK 缺少 assets/music/*.mp3');
  if (entries.some((e) => e.includes('\\'))) fail('APK 内有反斜杠路径：' + entries.filter((e) => e.includes('\\')).join(', '));
  log(`自检通过：${entries.length} 个条目，含 classes.dex / resources.arsc(未压缩) / assets/index.html / assets/music/*.mp3`);
}

const size = fs.statSync(finalApk).size;
log(`OK 完成：${finalApk}  (${(size / 1024 / 1024).toFixed(2)} MB)`);
