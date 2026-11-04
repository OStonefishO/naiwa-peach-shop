# -*- coding: utf-8 -*-
"""把游戏里那顶 SVG 厨师帽（#frog-chef 的 chef-hat 图层）栅格化，戴到奶蛙头上。

不直接抠那张带水印的库存图，而是复用游戏自己的矢量帽子：
白色蓬顶 + 奶油色帽箍 + 米色描边，和标题页里的奶蛙是同一套画风。
"""
import os
import re
from PIL import Image, ImageDraw, ImageFilter

ROOT = r"D:\文件\naiwahuangtaoguantou"

# ---- #frog-chef 的 viewBox 与帽子图层路径（照抄 src/v2.html:2643-2644） ----
HAT_PUFF = "M37 32c-3-11 6-19 16-18 2-10 15-13 22-6 8-7 20-1 20 9 10-1 16 7 14 16-1 5-6 8-11 8H49c-6 0-10-4-12-9z"
HAT_BAND = "M47 38h46v11H47z"
HAT_STROKE = (221, 203, 174)
BAND_FILL = (255, 253, 247)
GRAD_TOP = (255, 255, 255)
GRAD_BOTTOM = (241, 230, 209)

TOKEN_RE = re.compile(r"[MmCcLlHhVvZz]|-?\d*\.?\d+")


def flatten_path(d, samples=28):
    """把 M/C/L/H/V/Z 路径拍平成若干条折线（每段贝塞尔采样 samples 点）。"""
    toks = TOKEN_RE.findall(d)
    i = 0
    cur = (0.0, 0.0)
    start = (0.0, 0.0)
    subpaths, pts = [], []
    last_cmd = None

    def num():
        nonlocal i
        v = float(toks[i]); i += 1
        return v

    while i < len(toks):
        t = toks[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t; i += 1
        else:
            # 隐式重复上一个命令（只处理需要的情况）
            cmd = last_cmd
        last_cmd = cmd
        if cmd in "Mm":
            x, y = num(), num()
            if cmd == "m":
                x, y = cur[0] + x, cur[1] + y
            if pts:
                subpaths.append(pts)
            pts = [(x, y)]
            cur = start = (x, y)
        elif cmd in "Cc":
            x1, y1, x2, y2, x, y = (num() for _ in range(6))
            if cmd == "c":
                x1, y1, x2, y2, x, y = (cur[0] + x1, cur[1] + y1, cur[0] + x2,
                                        cur[1] + y2, cur[0] + x, cur[1] + y)
            p0 = cur
            for s in range(1, samples + 1):
                t2 = s / samples
                mt = 1 - t2
                bx = (mt ** 3) * p0[0] + 3 * (mt ** 2) * t2 * x1 + 3 * mt * (t2 ** 2) * x2 + (t2 ** 3) * x
                by = (mt ** 3) * p0[1] + 3 * (mt ** 2) * t2 * y1 + 3 * mt * (t2 ** 2) * y2 + (t2 ** 3) * y
                pts.append((bx, by))
            cur = (x, y)
        elif cmd in "Ll":
            x, y = num(), num()
            if cmd == "l":
                x, y = cur[0] + x, cur[1] + y
            pts.append((x, y)); cur = (x, y)
        elif cmd in "Hh":
            x = num()
            if cmd == "h":
                x = cur[0] + x
            pts.append((x, cur[1])); cur = (x, cur[1])
        elif cmd in "Vv":
            y = num()
            if cmd == "v":
                y = cur[1] + y
            pts.append((cur[0], y)); cur = (cur[0], y)
        elif cmd in "Zz":
            if pts:
                pts.append(start)
                subpaths.append(pts)
            pts = []
            cur = start
        else:
            raise ValueError("unsupported path command " + cmd)
    if pts:
        subpaths.append(pts)
    return subpaths


def render_hat(width_px, ss=6):
    """渲染整顶帽子（蓬 + 箍），返回 RGBA，尺寸按 width_px 等比。"""
    # 帽子在 viewBox 里的包围盒：x 37..111, y 8..49 → 74 x 41
    vb_w, vb_h = 74.0, 41.0
    scale = width_px * ss / vb_w
    W, H = int(round(vb_w * scale)), int(round(vb_h * scale))
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    def to_px(p):
        return ((p[0] - 37.0) * scale, (p[1] - 8.0) * scale)

    stroke_w = max(1, int(round(1.5 * scale)))

    def fill_polys(subpaths, color=None, grad=None):
        mask = Image.new("L", (W, H), 0)
        md = ImageDraw.Draw(mask)
        for sp in subpaths:
            md.polygon(sp, fill=255)
        if grad is not None:
            layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            layer.paste(grad, (0, 0), mask)
        else:
            layer = Image.new("RGBA", (W, H), color + (255,))
            layer.putalpha(mask)
        return layer

    def stroke_polys(subpaths):
        d = ImageDraw.Draw(img)
        for sp in subpaths:
            pts = list(sp)
            if pts[0] != pts[-1]:
                pts.append(pts[0])
            d.line(pts, fill=HAT_STROKE + (255,), width=stroke_w, joint="curve")

    # ① 蓬顶：垂直渐变填充 → 描边（先画，后画的帽箍会盖住它下沿的线，和 SVG 绘制顺序一致）
    puff = [[to_px(p) for p in sp] for sp in flatten_path(HAT_PUFF)]
    grad = Image.new("RGB", (1, H))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        t = y / max(1, H - 1)
        gd.point((0, y), tuple(int(GRAD_TOP[i] + (GRAD_BOTTOM[i] - GRAD_TOP[i]) * t) for i in range(3)))
    grad = grad.resize((W, H))
    img = Image.alpha_composite(img, fill_polys(puff, grad=grad))
    stroke_polys(puff)

    # ② 帽箍（白底 + 描边），盖在蓬顶下沿之上
    band = [[to_px(p) for p in sp] for sp in flatten_path(HAT_BAND)]
    img = Image.alpha_composite(img, fill_polys(band, color=BAND_FILL))
    stroke_polys(band)

    return img.resize((max(1, W // ss), max(1, H // ss)), Image.LANCZOS)


def head_metrics(blob):
    """找出脑袋的范围：从最上面一行不透明像素往下 18% 高度的横向包围盒。"""
    alpha = blob.getchannel("A")
    w, h = blob.size
    px = alpha.load()
    top = next(y for y in range(h) if any(px[x, y] > 40 for x in range(w)))
    bottom = min(h - 1, top + int(h * 0.18))
    xs = [x for y in range(top, bottom + 1) for x in range(w) if px[x, y] > 40]
    left, right = (min(xs), max(xs)) if xs else (0, w)
    return top, (left, right)


def eye_top(blob):
    """找出眼睛（绿色虹膜）最上面一行，帽子就压在这条线上面一点。"""
    px = blob.load()
    w, h = blob.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 60 and g > 100 and r < 130 and b < 130 and g > r + 20:
                return y
    return int(h * 0.12)


def composite_frog_with_hat(size=None):
    """立绘 + 厨师帽；返回 RGBA（上下留出透明余量，方便再排版）。"""
    blob = Image.open(os.path.join(ROOT, "src", "char-assets", "blob.png")).convert("RGBA")
    top, (left, right) = head_metrics(blob)
    eye_y = eye_top(blob)

    # 帽子宽度按脑袋包围盒来，帽箍下沿刚好压在眼睛上方
    head_w = right - left
    hat_w = int(head_w * 1.15)
    hat = render_hat(hat_w)
    # 立绘的脑袋微微朝左歪，帽子跟着转一点才不会像悬在半空
    hat = hat.rotate(-5, expand=True, resample=Image.BICUBIC)
    hx = (left + right) // 2 - hat.width // 2 + 4
    hat_bottom = max(top + 2, eye_y - 2) + 7
    hy = hat_bottom - hat.height

    pad = max(0, -hy) + 8
    canvas = Image.new("RGBA", (blob.width, blob.height + pad + 8), (0, 0, 0, 0))
    canvas.alpha_composite(blob, (0, pad))
    hy += pad

    # 帽檐落在脑门上的柔光阴影
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.ellipse([hx + int(hat.width * 0.10), hat_bottom + pad - 8,
                hx + int(hat.width * 0.90), hat_bottom + pad + 16], fill=(120, 90, 40, 60))
    sh = sh.filter(ImageFilter.GaussianBlur(7))
    canvas = Image.alpha_composite(canvas, sh)
    canvas.alpha_composite(hat, (hx, hy))
    return canvas


if __name__ == "__main__":
    out = os.path.join(ROOT, "dist", "toy", "_frog-hat.png")
    frog = composite_frog_with_hat()
    bg = Image.new("RGBA", frog.size, (255, 214, 190, 255))
    bg.alpha_composite(frog)
    bg.convert("RGB").save(out)
    print("preview", out, frog.size)
