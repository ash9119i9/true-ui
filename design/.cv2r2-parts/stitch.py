"""Stitch the wireframe shell and section fragments into design/convo-v2-wireframe-r2.html."""
import pathlib
import sys

parts = pathlib.Path(__file__).parent
out = parts.parent / "convo-v2-wireframe-r2.html"
page = (parts / "shell.html").read_text()
missing = []
for name in ["map", "stream", "requests", "chrome", "panel", "obs", "gaps"]:
    frag = parts / f"{name}.html"
    if frag.exists():
        page = page.replace(f"<!--PART:{name}-->", frag.read_text())
    else:
        missing.append(name)
# COUNTS: fill the hero numbers from the stitched content
import re
page = re.sub(r"<b>\d+</b> boards", "<b>%d</b> boards" % page.count('<div class="board">'), page)
page = re.sub(r"<b>\d+</b> annotations", "<b>%d</b> annotations" % page.count('<li><span class="pin">'), page)
gaps = (parts / "gaps.html").read_text()
page = re.sub(r"<b>\d+</b> new components", "<b>%d</b> new components" % gaps.split("<tbody>")[1].split("</tbody>")[0].count("<tr>"), page)
page = re.sub(r"<b>\d+</b> open questions", "<b>%d</b> open questions" % gaps.count('<div class="q">'), page)
out.write_text(page)
print(f"wrote {out} ({len(page):,} bytes)")
if missing:
    print("missing:", ", ".join(missing))
    sys.exit(1)
