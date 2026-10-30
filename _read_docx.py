from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn
import json

path = r"D:\奇葩素材\AI小游戏\奶蛙黄桃罐头店\奶蛙黄桃罐头店肉鸽模式制作内容.docx"
doc = Document(path)

def iter_block_items(parent):
    body = parent.element.body
    for child in body.iterchildren():
        if child.tag == qn('w:p'):
            yield Paragraph(child, parent)
        elif child.tag == qn('w:tbl'):
            yield Table(child, parent)

out = []
for i, block in enumerate(iter_block_items(doc)):
    if isinstance(block, Paragraph):
        txt = block.text.strip()
        if txt:
            out.append({"type": "p", "index": i, "style": block.style.name, "text": txt})
    else:
        rows = []
        for r in block.rows:
            cells = []
            for c in r.cells:
                cells.append(" / ".join(p.text.strip() for p in c.paragraphs if p.text.strip()))
            rows.append(cells)
        out.append({"type": "table", "index": i, "rows": rows})

with open(r"D:\文件\naiwahuangtaoguantou\_rogue_doc.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print("blocks", len(out))
