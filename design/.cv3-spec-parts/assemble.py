#!/usr/bin/env python3
"""Stitch the v3 dev spec: shell + nine section fragments + a generated coverage matrix.

Coverage: every '### ' / '#### ' heading in chat-ui-schema.md must appear in some fragment's
coverage table (<table class="tbl cov">) as a <td data-schema="..."> cell. Missing headings are
listed in the output and in the page, so gaps are visible instead of silent.
"""
import pathlib, re, sys, html as H

here = pathlib.Path(__file__).parent
root = here.parent.parent
out = here.parent / "convo-v3-dev-spec.html"
parts = {"a": "a-foundations", "b": "b-shell", "c": "c-composer", "d": "d-stream", "e": "e-requests",
         "f": "f-agents", "g": "g-panel", "h": "h-data", "i": "i-ship"}

page = (here / "shell.html").read_text()
missing = [f"{n}.html" for n in parts.values() if not (here / f"{n}.html").exists()]
for key, name in parts.items():
    f = here / f"{name}.html"
    frag = f.read_text() if f.exists() else f'<section class="part"><h2>{name} missing</h2></section>'
    frag = re.sub(r"(?is)<!doctype[^>]*>|</?(html|head|body)[^>]*>", "", frag)
    page = page.replace(f"@@PART:{key}@@", frag.strip())

# coverage: schema headings vs data-schema cells claimed by fragments
schema = (root / "chat-ui-schema.md").read_text().splitlines()
heads, section = [], ""
for line in schema:
    m = re.match(r"^(#{2,4}) (.+)$", line)
    if not m:
        continue
    level, text = len(m.group(1)), m.group(2).strip()
    if level == 2:
        section = text
        continue
    if section.startswith(("Contents", "Redesign gaps")):
        continue
    heads.append((section, text))

def norm(s):
    s = re.sub(r"`|\*", "", s).lower()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

claimed = {}
for m in re.finditer(r'<td data-schema="([^"]+)"[^>]*>.*?</td>\s*<td>(.*?)</td>', page, re.S):
    claimed.setdefault(norm(H.unescape(m.group(1))), m.group(2).strip())

rows, gaps = [], []
for sec, head in heads:
    where = claimed.get(norm(head))
    if where is None:
        gaps.append(f"{sec} :: {head}")
    cell = where if where is not None else '<span class="tag backend">not covered</span>'
    rows.append(f"<tr><td>{H.escape(head)}</td><td>{H.escape(sec)}</td><td>{cell}</td></tr>")

cov = ('<section class="part" id="coverage"><h2>Coverage matrix</h2>'
       f'<p>Every component and topic heading in <code>chat-ui-schema.md</code> ({len(heads)} in total), mapped to where this spec covers it. '
       f'This table is generated when the page is assembled. <b>{len(heads) - len(gaps)} of {len(heads)}</b> are covered.</p>'
       '<div class="tw"><table class="tbl"><thead><tr><th>Schema heading</th><th>Schema section</th><th>Covered in</th></tr></thead><tbody>'
       + "".join(rows) + "</tbody></table></div></section>")
page = page.replace("@@COVERAGE@@", cov)

left = re.findall(r"@@(?:PART:\w+|COVERAGE)@@", page)
if left:
    sys.exit("unfilled placeholders: " + ", ".join(left))
out.write_text(page)
print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")
print(f"coverage: {len(heads) - len(gaps)}/{len(heads)}")
for g in gaps:
    print("  not covered:", g)
if missing:
    print("missing fragments:", ", ".join(missing))
sys.exit(1 if (missing or gaps) else 0)
