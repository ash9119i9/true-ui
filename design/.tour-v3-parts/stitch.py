"""Stitch the v3 tour shell and fragments into design/app-tour-v3.html."""
import pathlib, re, sys
parts = pathlib.Path(__file__).parent
out = parts.parent / "app-tour-v3.html"
page = (parts / "shell.html").read_text()
missing = []
for name in ["anatomy", "flow", "ch1", "ch2", "ch3", "team", "create", "edges", "spec"]:
    frag = parts / f"{name}.html"
    if frag.exists():
        page = page.replace(f"<!--PART:{name}-->", frag.read_text())
    else:
        missing.append(name)
page = re.sub(r"<b>\d+</b> boards", "<b>%d</b> boards" % page.count('<div class="board">'), page)
page = re.sub(r"<b>\d+</b> annotations", "<b>%d</b> annotations" % page.count('<li><span class="pin">'), page)
page = re.sub(r"<b>\d+</b> backend waits", "<b>%d</b> backend waits" % page.count('<span class="tag backend">'), page)
page = re.sub(r"<b>\d+</b> open decisions", "<b>%d</b> open decisions" % page.count('<div class="q">'), page)
out.write_text(page)
print(f"wrote {out} ({len(page):,} bytes)")
if missing:
    print("missing:", ", ".join(missing)); sys.exit(1)
