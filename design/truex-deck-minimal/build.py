#!/usr/bin/env python3
"""Build the minimal truex introduction deck from slides/NN-name.html fragments.

Each fragment is exactly one <section class="slide ..."> ... </section>.
The build injects the shared chrome (mono top strip + footer with page number):
  data-top="01 · the problem"        top-left mono label
  data-top-right="..."               top-right mono label (default below; "" hides it)
  data-chrome="none"                 skip the injected chrome entirely

Outputs:
  index.html            the whole deck (scroll view, prints one slide per page)
  build/slide-NN.html   one flat 1920×1080 page per slide, used by render.sh
"""
import os
import pathlib
import re
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent
BUILD = ROOT / "build"
TOP_RIGHT = "truex · introduction · october 2026"

FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800'
    '&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'
)

# Shared symbols. Use with <svg><use href="#id"/></svg>.
DEFS = """<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <clipPath id="clover" clipPathUnits="objectBoundingBox"><path d="M.5,.1 C.82,-.1 1.1,.18 .9,.5 C1.1,.82 .82,1.1 .5,.9 C.18,1.1 -.1,.82 .1,.5 C-.1,.18 .18,-.1 .5,.1Z"/></clipPath>
  <symbol id="spark" viewBox="0 0 40 40"><path d="m20 8 3.2 8.5 8.5 3.2-8.5 3.2L20 31.4l-3.2-8.5-8.5-3.2 8.5-3.2Z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/></symbol>
  <symbol id="ext" viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</svg>"""

SECTION = re.compile(r"\s*(<section\b[^>]*>)(.*)</section>\s*$", re.S)
ATTR = re.compile(r'(data-[\w-]+)="([^"]*)"')


def chrome(attrs, idx, total):
    if attrs.get("data-chrome") == "none":
        return ""
    left = attrs.get("data-top", "")
    right = attrs.get("data-top-right", TOP_RIGHT)
    pg = "" if idx == 0 else f'<span class="pg">{idx:02d} / {total - 1:02d}</span>'
    return (
        f'<div class="s-top"><span>{left}</span><span>{right}</span></div>'
        f'<div class="s-foot"><span class="bm"><svg><use href="#spark"/></svg></span>truex{pg}</div>'
    )


def page(body, css, title, flat):
    body_cls = ' class="flat"' if flat else ""
    return (
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        f"<title>{title}</title>\n{FONTS}\n<link rel=\"stylesheet\" href=\"{css}\">\n</head>\n"
        f'<body{body_cls}>\n{DEFS}\n<main class="deck">\n{body}\n</main>\n</body>\n</html>\n'
    )


def write(path, text):
    # atomic, so parallel builds never leave a half-written file
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, path)


def main():
    frags = sorted((ROOT / "slides").glob("[0-9][0-9]-*.html"))
    total = len(frags)
    slots = []
    for idx, frag in enumerate(frags):
        src = frag.read_text(encoding="utf-8")
        m = SECTION.match(src)
        if not m:
            raise SystemExit(f"{frag.name}: must contain exactly one <section class=\"slide\"> … </section>")
        open_tag, inner = m.groups()
        attrs = dict(ATTR.findall(open_tag))
        slot = f'<div class="slot" id="s{idx:02d}">{open_tag}{inner}{chrome(attrs, idx, total)}</section></div>'
        slots.append(slot)
        write(BUILD / f"slide-{idx:02d}.html", page(slot, "../deck.css", f"truex · {frag.stem}", True))
    write(ROOT / "index.html", page("\n".join(slots), "deck.css", "truex · Introduction deck (minimal) · October 2026", False))
    print(f"built {total} slides -> index.html, build/slide-00..{total - 1:02d}.html")


if __name__ == "__main__":
    main()
