#!/usr/bin/env python3
"""Stitch the spec shell, the four section fragments and the base64 screenshots into one HTML file."""
import pathlib, re, sys

here = pathlib.Path(__file__).parent
out = here.parent / "join-tenant-v3-dev-spec.html"

html = (here / "shell.html").read_text()
parts = {"a": "a-foundations.html", "b": "b-invite.html", "c": "c-board.html", "d": "d-build.html"}
missing = [f for f in parts.values() if not (here / f).exists()]
if missing:
    sys.exit("missing parts: " + ", ".join(missing))

for key, name in parts.items():
    frag = (here / name).read_text()
    # fragments must not carry their own document skeleton or styles
    frag = re.sub(r"(?is)<!doctype[^>]*>|</?(html|head|body)[^>]*>|<style.*?</style>", "", frag)
    html = html.replace(f"@@PART:{key}@@", frag.strip())

for shot in ("light", "dark", "typed", "expired", "phone"):
    html = html.replace(f"@@IMG:{shot}@@", (here / f"img-{shot}.b64").read_text().strip())

left = re.findall(r"@@(?:PART|IMG):\w+@@", html)
if left:
    sys.exit("unfilled placeholders: " + ", ".join(left))

out.write_text(html)
print(out, f"{out.stat().st_size / 1024:.0f} KB")
