"""Stitch the v3 shell and section fragments into design/convo-v3-wireframe.html."""
import pathlib, re, sys

parts = pathlib.Path(__file__).parent
out = parts.parent / "convo-v3-wireframe.html"
page = (parts / "shell.html").read_text()
names = ["map", "nav", "composer", "stream", "requests", "agents", "obs", "states", "system"]
missing = []
for name in names:
    frag = parts / f"{name}.html"
    if frag.exists():
        page = page.replace(f"<!--PART:{name}-->", frag.read_text())
    else:
        missing.append(name)
page = re.sub(r"<b>\d+</b> boards", "<b>%d</b> boards" % page.count('<div class="board">'), page)
page = re.sub(r"<b>\d+</b> annotations", "<b>%d</b> annotations" % page.count('<li><span class="pin">'), page)
page = re.sub(r"<b>\d+</b> new components", "<b>%d</b> new components" % page.count('<span class="tag new">'), page)
page = re.sub(r"<b>\d+</b> open questions", "<b>%d</b> open questions" % page.count('<div class="q">'), page)
out.write_text(page)
print(f"wrote {out} ({len(page):,} bytes)")
if missing:
    print("missing:", ", ".join(missing))
    sys.exit(1)
