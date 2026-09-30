"""Stitch the wireframe shell and section fragments into design/convo-v2-wireframe.html."""
import pathlib
import sys

parts = pathlib.Path(__file__).parent
out = parts.parent / "convo-v2-wireframe.html"
page = (parts / "shell.html").read_text()
missing = []
for name in ["map", "stream", "requests", "chrome", "obs", "gaps"]:
    frag = parts / f"{name}.html"
    if frag.exists():
        page = page.replace(f"<!--PART:{name}-->", frag.read_text())
    else:
        missing.append(name)
out.write_text(page)
print(f"wrote {out} ({len(page):,} bytes)")
if missing:
    print("missing:", ", ".join(missing))
    sys.exit(1)
