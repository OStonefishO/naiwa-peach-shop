import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = r'D:\文件\naiwahuangtaoguantou'
SRC = os.path.join(ROOT, 'src', 'char-assets', 'blob.png')
RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')

SIZES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

blob = Image.open(SRC).convert('RGBA')

def make(size):
    S = size * 4  # supersample
    bg = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(bg)
    # 蜜桃色渐变背景（近似纵向渐变）
    top = (255, 214, 168)
    bot = (255, 168, 150)
    for y in range(S):
        t = y / max(1, S - 1)
        c = tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,)
        d.line([(0, y), (S, y)], fill=c)
    # 圆角方形遮罩
    radius = int(S * 0.225)
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=radius, fill=255)
    bg.putalpha(mask)
    # 高光
    hl = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(hl).ellipse([int(S * 0.1), int(S * -0.05), int(S * 0.9), int(S * 0.5)],
                               fill=(255, 255, 255, 40))
    hl = hl.filter(ImageFilter.GaussianBlur(S * 0.05))
    bg = Image.alpha_composite(bg, hl)

    w, h = blob.size
    target = int(S * 0.70)
    scale = target / max(w, h)
    nb = blob.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    ox = (S - nb.width) // 2
    oy = int(S * 0.56) - nb.height // 2
    layer = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    layer.paste(nb, (ox, oy), nb)
    out = Image.alpha_composite(bg, layer)
    return out.resize((size, size), Image.LANCZOS)

for dpi, size in SIZES.items():
    d = os.path.join(RES, 'mipmap-' + dpi)
    os.makedirs(d, exist_ok=True)
    img = make(size)
    img.save(os.path.join(d, 'ic_launcher.png'))
    img.save(os.path.join(d, 'ic_launcher_round.png'))
    print(dpi, size, 'ok')
print('done')
