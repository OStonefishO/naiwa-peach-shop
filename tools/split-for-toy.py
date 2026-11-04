# -*- coding: utf-8 -*-
"""把内联单文件拆成 Toy 能接受的多个文件（每个解压后都要 < 1MB）。

拆法：
  * <style>…</style>          → style.css
  * <script>…</script>        → app.js
  * data:image/…base64,…      → assets/<hash>.png|jpg
  * data:audio/…base64,…      → assets/<hash>.mp3
留下 index.html 只负责骨架，所有资源走相对路径。
"""
import hashlib
import os
import re
import shutil
import zipfile

ROOT = r"D:\文件\naiwahuangtaoguantou"
SRC = os.path.join(ROOT, "wechat-qq", "index.html")
OUT = os.path.join(ROOT, "dist", "toy", "split")
ZIP = os.path.join(ROOT, "dist", "toy", "naiwa-peach-shop-5.0-toy.zip")
LIMIT = 1024 * 1024  # 1MB

MIME_EXT = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/webp": ".webp",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
}

DATA_URI_RE = re.compile(r"data:(image|audio)/(png|jpeg|jpg|webp|mpeg|mp3);base64,([A-Za-z0-9+/=]+)")


def main():
    html = open(SRC, encoding="utf-8").read()

    # ① 抽出 <style> 与 <script>
    css_blocks = re.findall(r"<style[^>]*>(.*?)</style>", html, re.S)
    js_blocks = re.findall(r"<script[^>]*>(.*?)</script>", html, re.S)
    assert len(css_blocks) == 1, f"style 块数量异常: {len(css_blocks)}"
    assert len(js_blocks) == 1, f"script 块数量异常: {len(js_blocks)}"
    css = css_blocks[0]
    js = js_blocks[0]

    html = re.sub(r"<style[^>]*>.*?</style>", '<link rel="stylesheet" href="style.css">', html, count=1, flags=re.S)
    html = re.sub(r"<script[^>]*>.*?</script>", '<script src="app.js"></script>', html, count=1, flags=re.S)

    # ② 把三份文本里的 base64 资源挪成独立文件
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "assets"))

    written = {}

    def repl(m):
        mime = f"{m.group(1)}/{m.group(2)}"
        payload = m.group(3)
        ext = MIME_EXT.get(mime)
        if not ext:
            return m.group(0)
        digest = hashlib.sha1(payload.encode("ascii")).hexdigest()[:12]
        name = f"assets/{digest}{ext}"
        if name not in written:
            written[name] = len(payload)
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(__import__("base64").b64decode(payload))
        return name

    html = DATA_URI_RE.sub(repl, html)
    css = DATA_URI_RE.sub(repl, css)
    js = DATA_URI_RE.sub(repl, js)

    assert "base64," not in html and "base64," not in js and "base64," not in css, "还有残留的 base64 资源"

    # ③ 落盘
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(html)
    open(os.path.join(OUT, "style.css"), "w", encoding="utf-8").write(css)
    open(os.path.join(OUT, "app.js"), "w", encoding="utf-8").write(js)

    music_src = os.path.join(ROOT, "wechat-qq", "music")
    os.makedirs(os.path.join(OUT, "music"), exist_ok=True)
    for name in sorted(os.listdir(music_src)):
        shutil.copy2(os.path.join(music_src, name), os.path.join(OUT, "music", name))
    shutil.copy2(os.path.join(ROOT, "wechat-qq", "version.json"), os.path.join(OUT, "version.json"))

    # ④ 打包 + 体积自检
    if os.path.exists(ZIP):
        os.remove(ZIP)
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for base, _dirs, files in os.walk(OUT):
            for f in sorted(files):
                full = os.path.join(base, f)
                rel = os.path.relpath(full, OUT).replace("\\", "/")
                z.write(full, rel)

    print(f"{'file':34s} {'raw':>9s} {'zip':>9s}")
    total = 0
    over = []
    with zipfile.ZipFile(ZIP) as z:
        for info in z.infolist():
            total += info.file_size
            flag = ""
            if info.file_size > LIMIT:
                flag = "  ← 超过 1MB"
                over.append(info.filename)
            print(f"{info.filename:34s} {info.file_size:>9d} {info.compress_size:>9d}{flag}")
    print(f"zip 总大小 {os.path.getsize(ZIP)} B；解压后总计 {total} B")
    if over:
        raise SystemExit("仍有文件超过 1MB：" + ", ".join(over))
    print("OK：每个文件解压后都小于 1MB")


if __name__ == "__main__":
    main()
