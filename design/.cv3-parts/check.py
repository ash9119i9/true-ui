"""Lint v3 fragments against BRIEF.md rules."""
import pathlib, re
from html.parser import HTMLParser

PREFIX = dict(map="mp-", nav="nv-", composer="cp-", stream="sm-", requests="rq-",
              agents="ag-", obs="ob-", states="ss-", system="sy-")
VOID = {"br", "img", "input", "meta", "link", "hr", "source", "wbr", "col", "path", "circle",
        "rect", "use", "line", "polyline", "polygon", "ellipse", "stop"}
BANNED = ["reasoningSummary", "serviceTier", "personality", "Limited access", "usageByAgent"]


class Bal(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack, self.err, self.ids = [], [], []

    def handle_starttag(self, t, a):
        d = dict(a)
        if "id" in d:
            self.ids.append(d["id"])
        if t not in VOID:
            self.stack.append(t)

    def handle_startendtag(self, t, a):
        d = dict(a)
        if "id" in d:
            self.ids.append(d["id"])

    def handle_endtag(self, t):
        if t in VOID:
            return
        if self.stack and self.stack[-1] == t:
            self.stack.pop()
        else:
            self.err.append(f"unexpected </{t}> (open: {self.stack[-3:]})")


allids = {}
parts = pathlib.Path(__file__).parent
for name, pre in PREFIX.items():
    f = parts / f"{name}.html"
    if not f.exists():
        print(f"{name:9} pending")
        continue
    src = f.read_text()
    issues = []
    b = Bal()
    b.feed(src)
    issues += b.err[:3]
    if b.stack:
        issues.append(f"unclosed: {b.stack[-4:]}")
    if not re.search(rf'<section class="sec" id="{name}"', src):
        issues.append("bad root")
    css = re.sub(r"/\*.*?\*/", "", "".join(re.findall(r"<style>(.*?)</style>", src, re.S)), flags=re.S)
    lit = re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d", css)
    if lit:
        issues.append(f"literal colors in css: {lit[:4]}")
    sels = re.findall(r"(?:^|[{}])\s*([^{}@]+)\{", re.sub(r"@media[^{]*\{", "}", css))
    bad = sorted({p.strip() for s in sels for p in s.split(",")
                  if p.strip() and pre not in p and not re.match(r"^(from|to|\d+%)$", p.strip())})
    if bad:
        issues.append(f"unprefixed selectors: {bad[:3]}")
    text = re.sub(r"<style>.*?</style>", "", src, flags=re.S)
    if "—" in text:
        issues.append(f"em dashes: {text.count(chr(0x2014))}")
    visible = re.sub(r"<[^>]+>", " ", text)
    if re.search(r"\w!(\s|$)", visible):
        issues.append("exclamation mark")
    for w in BANNED:
        if re.search(rf"\b{re.escape(w)}\b", visible):
            issues.append(f"mentions '{w}' (verify context)")
    for i in b.ids:
        allids.setdefault(i, []).append(name)
    boards = src.count('<div class="board">')
    notes = src.count('<li><span class="pin">')
    status = "OK" if not issues else "\n    - " + "\n    - ".join(issues)
    print(f"{name:9} {len(src.splitlines()):4} lines  {boards} boards  {notes:2} notes  {status}")

dup = {k: v for k, v in allids.items() if len(v) > 1}
if dup:
    print("duplicate ids across fragments:", dup)
