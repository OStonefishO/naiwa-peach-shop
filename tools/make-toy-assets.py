# -*- coding: utf-8 -*-
"""生成 Bilibili Toy 上传用的封面（4:3, 1200x900）与图标（1:1, 500x500）。"""
import os
import zipfile
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = r"D:\文件\naiwahuangtaoguantou"
OUT = os.path.join(ROOT, "dist", "toy")
SHOT = os.path.join(ROOT, "docs", "toy", "title-shot.png")
os.makedirs(OUT, exist_ok=True)

BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
REG = r"C:\Windows\Fonts\msyh.ttc"

CREAM = (255, 246, 230)
PEACH_L = (255, 231, 207)
PEACH = (255, 205, 170)
BROWN = (90, 59, 30)
BROWN_L = (122, 90, 58)
RED = (224, 106, 69)
GOLD = (255, 196, 61)


def font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def vgradient(size, top, bottom):
    w, h = size
    img = Image.new("RGB", (1, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        d.point((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return img.resize((w, h), Image.BILINEAR)


def make_cover():
    W, H = 1200, 900
    bg = vgradient((W, H), CREAM, PEACH_L).convert("RGB")
    d = ImageDraw.Draw(bg, "RGBA")

    # 柔和的桃色光斑
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-200, -260, 560, 480], fill=(255, 208, 170, 160))
    gd.ellipse([760, 460, 1480, 1180], fill=(255, 196, 160, 140))
    glow = glow.filter(ImageFilter.GaussianBlur(90))
    bg = Image.alpha_composite(bg.convert("RGBA"), glow)
    d = ImageDraw.Draw(bg, "RGBA")

    # 右侧：整张标题页卡片（去掉外面的绿底），当手机预览用
    shot = Image.open(SHOT).convert("RGB")
    card_src = shot.crop((79, 373, 1003, 2028))
    ch = 790
    cw = int(card_src.width * ch / card_src.height)
    card_src = card_src.resize((cw, ch), Image.LANCZOS)
    card = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    card.paste(card_src, (0, 0))
    card.putalpha(rounded_mask((cw, ch), 30))

    cx, cy = 660, 55
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([cx + 4, cy + 18, cx + cw + 4, cy + ch + 18], radius=30, fill=(120, 70, 30, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    bg = Image.alpha_composite(bg, shadow)
    bg.alpha_composite(card, (cx, cy))
    d = ImageDraw.Draw(bg, "RGBA")
    d.rounded_rectangle([cx, cy, cx + cw, cy + ch], radius=30, outline=(230, 194, 148, 255), width=3)

    # 左侧文字
    x = 84
    d.rounded_rectangle([x, 104, x + 230, 148], radius=22, fill=(255, 255, 255, 205), outline=(232, 200, 160, 255), width=2)
    d.text((x + 16, 112), "SUMMER PEACH · 2026", font=font(BOLD, 19), fill=(150, 110, 70))

    d.text((x, 182), "奶蛙黄桃", font=font(BOLD, 100), fill=BROWN)
    d.text((x, 296), "罐头店", font=font(BOLD, 100), fill=RED)
    d.text((x + 2, 440), "奶蛙的夏日小店 · 28 天经营", font=font(REG, 32), fill=BROWN_L)

    bullets = ["切桃 · 熬糖 · 装罐 · 出餐", "肉鸽 / 无尽 / 新手教学", "创意工坊做地图"]
    by = 512
    for b in bullets:
        d.ellipse([x + 6, by + 13, x + 19, by + 26], fill=GOLD)
        d.text((x + 34, by), b, font=font(REG, 28), fill=BROWN_L)
        by += 52

    tags = ["手机竖屏", "免下载", "4 种模式"]
    tx, ty = x, 700
    for t in tags:
        f = font(BOLD, 24)
        tw = d.textlength(t, font=f)
        pw = tw + 38
        d.rounded_rectangle([tx, ty, tx + pw, ty + 46], radius=23, fill=(255, 255, 255, 215), outline=(232, 200, 160, 255), width=2)
        d.text((tx + 19, ty + 9), t, font=f, fill=BROWN_L)
        tx += pw + 12

    out = os.path.join(OUT, "cover-1200x900.png")
    bg.convert("RGB").save(out, "PNG", optimize=True)
    print("cover", out, bg.size)


def _load_hat_module():
    import importlib.util
    path = os.path.join(ROOT, "tools", "make-frog-hat.py")
    spec = importlib.util.spec_from_file_location("naiwa_frog_hat", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def make_icon():
    S = 500
    frog = _load_hat_module().composite_frog_with_hat()
    frog = frog.crop(frog.getbbox())

    base = vgradient((S, S), (255, 220, 190), (255, 190, 170)).convert("RGB")
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([-120, -160, 380, 340], fill=(255, 240, 210, 160))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    base = Image.alpha_composite(base.convert("RGBA"), glow)

    target = int(S * 0.84)
    scale = target / max(frog.width, frog.height)
    nb = frog.resize((max(1, int(frog.width * scale)), max(1, int(frog.height * scale))), Image.LANCZOS)
    ox = (S - nb.width) // 2
    oy = int(S * 0.56) - nb.height // 2
    base.alpha_composite(nb, (ox, oy))

    base = base.convert("RGB")
    out = os.path.join(OUT, "icon-500x500.png")
    base.save(out, "PNG", optimize=True)
    print("icon", out, base.size)



if __name__ == "__main__":
    make_cover()
    make_icon()
    print("提示：上传包由 tools/split-for-toy.py 生成（单文件内联资源会超过 1MB）")
