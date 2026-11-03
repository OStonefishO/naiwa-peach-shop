# 奶蛙黄桃罐头店 · Android APK

把网页版（`wechat-qq/index.html`）原样装进一个 WebView 壳，做出可安装的安卓 App。
游戏逻辑零改动，网页版和 APK 版共用同一份构建产物。

## 结构

```
android/
  app/src/main/
    AndroidManifest.xml          包名 com.naiwa.peachshop，versionCode / versionName 由 src/v2.html 的版本推导（当前 5.0 → 500）
    java/com/naiwa/peachshop/
      MainActivity.java          全屏 WebView、开屏动画、返回键确认、文件选择器、外链跳系统浏览器
      AssetServer.java           内置极简 localhost HTTP 服务器（支持 Range/206、MIME 表）
    res/values/                  strings/styles/colors
    res/layout/                  splash.xml（开屏）、dialog_exit.xml（退出确认卡片）
    res/drawable/                dialog_card / btn_primary / btn_ghost
    res/mipmap-*/                ic_launcher（由 src/char-assets/blob.png 生成）
  gen_icons.py                   生成启动图标（Pillow）
  build-apk.cjs                  手工构建脚本（不用 Gradle）
  out/naiwa-peach-shop-<版本>.apk  构建产物（不入库）
  screenshots/                   模拟器实机截图
dist/naiwa-peach-shop-<版本>.apk 随 main 提交的安装包，CI 用它发 Release
```

## 为什么要内置 HTTP 服务器

WebView 直接用 `file:///android_asset/index.html` 打开时，页面是 `file://` 源：

- `localStorage` 在这类源下行为不稳定，游戏存档会丢；
- 页面里的 `fetch` 请求会被 CORS 拦死，排行榜 / 创意工坊上传全废。

所以 `MainActivity` 启动时开一个只监听 `127.0.0.1` 的随机端口静态服务器，页面从
`http://127.0.0.1:port/index.html` 加载 —— 这样它就是一个正常网页，存档、fetch、IndexedDB 都正常。

## 构建

前置：JDK 17（`D:\文件\_android_toolchain\jdk17`）、Android SDK（`D:\文件\_android_sdk`，
需要 `platforms;android-34` 与 `build-tools;34.0.0`）。

```powershell
# 1. 先重新生成网页版单文件（同时写 wechat-qq/version.json）
node src/build.cjs

# 2. 再打 APK（版本号自动从 src/v2.html 的 <title> 读取，产物同时落到 dist/）
node android/build-apk.cjs
```

> 装好后再点「设置 → 检查更新」会去 `https://ostonefisho.github.io/naiwa-peach-shop/version.json`
> 比对版本；页面靠 UA 里的 `NaiwaAndroid/<版本>` 判断自己跑在 APK 里，从而给下载入口而不是网页。

脚本做的事：

1. 把 `wechat-qq/index.html` 和 `wechat-qq/music/*.mp3` 同步进 `assets/`；
2. `aapt2 compile` + `aapt2 link --java` 生成基础 APK（带资源、清单、assets）与 `R.java`；
3. **修正 assets 路径分隔符** —— aapt2 在 Windows 上会把 `music\title.mp3` 写成反斜杠，
   这里在字节层面就地替换成正斜杠（等长替换，不动 zip 结构，`resources.arsc` 保持 STORED）；
4. `javac` 编译 Java 源码 + `R.java`，`d8` 转成 `classes.dex`，再塞进 APK；
5. `zipalign -p 4`，`apksigner` 用 `C:\naiwa_apk_keys\naiwa-release.jks` 签名并校验；
6. **产物自检**：确认 `AndroidManifest.xml` / `classes.dex` / `resources.arsc`(必须未压缩) /
   `assets/index.html` / `assets/music/*.mp3` 都在，且没有反斜杠路径；
7. 把签名包复制到 `dist/`（旧的同前缀 apk 会被清掉），随 `main` 提交后由
   `.github/workflows/release-apk.yml` 用 `gh release upload --clobber` 挂到 `v<版本>` 这个 Release。

> aapt2 不认中文路径，所以脚本把所有编译动作放在 ASCII 暂存目录 `C:\naiwa_apk_build` 里做，
> 只有最终 APK 和签名密钥留在项目侧。

## 三个曾经踩过的坑（改脚本前请先看）

1. **`classes.dex` 静默丢失**：注入 dex 的 PowerShell 片段如果没先
   `Add-Type -AssemblyName System.IO.Compression`，`[ZipArchiveMode]` 类型解析失败会抛异常，
   而 `powershell -Command` 的异常不改变退出码 → 构建「成功」但 dex 不在包里。
   现在片段里有 `$ErrorActionPreference = "Stop"` + 自检兜底。
2. **`resources.arsc` 被压缩 → 安装报 `[-124]`**：targetSdk ≥ 30 要求 arsc 未压缩且 4 字节对齐。
   早期「重建整个 zip 修反斜杠」会把它压成 DEFLATE，安装直接失败。现在改成字节级等长替换。
3. **启动即崩（沉浸式全屏 NPE）**：`applyImmersive()` 不能在 `setContentView` 之前调用，
   那时 `PhoneWindow.mDecor == null`，`getWindow().getInsetsController()` 会 NPE。

## 模拟器验证记录

测试机：Android 14（API 34）x86_64 模拟器，1080×2400。

- 冷启动 → 开屏「奶蛙的小店 正在开张…」→ 标题页 4.71 正常渲染；
- 开始营业 → 服务台 / 餐厅 / 工作台 / 厨房四个页签切换正常，订单卡、计时条、拖拽区都正常；
- 交互正常：点「切大块」三次，碗里计数 0 → 3；
- 音频正常：`dumpsys audio` 显示 `com.naiwa.peachshop` 拿到 `USAGE_MEDIA` 音频焦点（背景音乐在放）；
- 存档正常：`app_webview/Default/Local Storage/leveldb` 里写入 `naiwa_v` / `naiwa_profiles_v` / `naiwa_active_v`；
- 暂停菜单（暂时打样 / 提前下班）正常，返回键弹出奶油色「要离开小店了吗？」自定义卡片；
- 强制停止后重启，能回到标题页，无崩溃、无 FATAL 日志；
- 「设置 → 检查更新」实测：先显示「正在比对版本…」，拿到官网 `version.json` 后变成
  「✅ 已是最新 · 5.0」（断网时会变成「⚠️ 检查失败 · 点我重试」）；
- 开机静默自检实测：把本地版本临时改成 4.9 打包，启动 3 秒后标题页「设置」按钮上出现小红点，
  进设置后按钮变成「🎉 新版本 5.0 · 点我打开」，点一下由系统浏览器打开 Release 页。

> 模拟器必须在**纯 ASCII 路径**下运行，否则 qemu 会静默卡死：
> `cmd /c mklink /J C:\asdk "D:\文件\_android_sdk"`，然后用 `C:\asdk\emulator\emulator.exe` 启动。

## 签名密钥

- 路径：`C:\naiwa_apk_keys\naiwa-release.jks`
- alias：`naiwa`，store/key 口令：`naiwa2026`
- 证书 SHA-256：`d8765eca31fb3e0c52e34a547b47d43b858d781365bc29ce783788bd0bcf33f4`
- **务必长期保留**：换了密钥签名的 APK 无法覆盖安装，只能卸载重装（存档会丢）。

## 安装

- 手机直接下载：<https://github.com/OStonefishO/naiwa-peach-shop/releases/latest>
- 或者用本地构建产物 `android/out/naiwa-peach-shop-5.0.apk`（与 `dist/` 里的一致）。

允许「安装未知来源应用」后点击安装，系统要求 Android 7.0（API 24）及以上。
