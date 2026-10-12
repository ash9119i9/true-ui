#!/bin/sh
# Export truex-introduction-deck-elevated.pdf from 2× screenshots of each slide.
# Chrome's print-to-PDF flattens box-shadows, drop-shadow filters and backdrop blur into
# gray boxes, so the PDF is assembled from screenshots instead (pixel-identical to the deck).
# Screenshots are flat images, so every <a href> on a slide is measured in Chrome and re-added
# as a clickable link annotation at the same spot on its PDF page.
# Usage: python3 build.py && ./make-pdf.sh
set -eu
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p build/png2x build/links

# Run headless Chrome in the background and stop it once $out is written (it can hang after).
# $1 = output file, $2 = test that means "done", rest = chrome args
run_chrome() {
  out=$1; done_test=$2; shift 2
  profile=$(mktemp -d)
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
    --user-data-dir="$profile" --virtual-time-budget=5000 --window-size=1920,1080 "$@" >"$out.stdout" 2>/dev/null &
  pid=$!
  i=0
  while kill -0 "$pid" 2>/dev/null && [ $i -lt 80 ]; do
    if eval "$done_test"; then sleep 1; break; fi
    sleep 0.5; i=$((i + 1))
  done
  kill "$pid" 2>/dev/null || true
  pkill -f "user-data-dir=$profile" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  rm -rf "$profile"
}

MEASURE='<script>addEventListener("load",()=>document.fonts.ready.then(()=>{const r=[...document.querySelectorAll("a[href]")].filter(a=>!a.getAttribute("href").startsWith("#")).map(a=>{const b=a.getBoundingClientRect();return{href:a.href,x:b.left,y:b.top,w:b.width,h:b.height}});const p=document.createElement("pre");p.id="__links";p.textContent=JSON.stringify(r);document.body.appendChild(p)}))</script>'

for f in build/slide-*.html; do
  n=$(basename "$f" .html | sed 's/slide-//')

  # 1. screenshot
  out="$PWD/build/png2x/$n.png"
  rm -f "$out"
  run_chrome "$out" '[ -s "$out" ]' --force-device-scale-factor=2 --screenshot="$out" "file://$PWD/$f"
  rm -f "$out.stdout"
  [ -s "$out" ] || { echo "FAILED slide $n" >&2; exit 1; }

  # 2. link positions (temporary copy of the slide with a measuring script, same folder so assets resolve)
  m="build/.measure-$n.html"
  MEASURE="$MEASURE" python3 -I -c 'import os,sys; s=open(sys.argv[1],encoding="utf-8").read(); open(sys.argv[2],"w",encoding="utf-8").write(s.replace("</body>", os.environ["MEASURE"]+"</body>",1))' "$f" "$m"
  dom="$PWD/build/links/$n.dom"
  rm -f "$dom.stdout"
  run_chrome "$dom" 'grep -q "</html>" "$dom.stdout" 2>/dev/null' --dump-dom "file://$PWD/$m"
  python3 -I - "$dom.stdout" "$PWD/build/links/$n.json" <<'PY'
import html, json, re, sys
s = open(sys.argv[1], encoding="utf-8", errors="ignore").read()
m = re.search(r'<pre id="__links">(.*?)</pre>', s, re.S)
links = json.loads(html.unescape(m.group(1))) if m else []
json.dump(links, open(sys.argv[2], "w"))
PY
  rm -f "$m" "$dom.stdout"
done

swift - "$PWD/build/png2x" "$PWD/build/links" "$PWD/truex-introduction-deck-elevated.pdf" <<'EOF'
import AppKit
import PDFKit
let dir = URL(fileURLWithPath: CommandLine.arguments[1])
let linkDir = URL(fileURLWithPath: CommandLine.arguments[2])
let out = URL(fileURLWithPath: CommandLine.arguments[3])
struct Link: Decodable { let href: String; let x, y, w, h: Double }
let files = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
  .filter { $0.pathExtension == "png" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
let doc = PDFDocument()
var total = 0
for (i, url) in files.enumerated() {
  guard let img = NSImage(contentsOf: url) else { fatalError("cannot read \(url.path)") }
  img.size = NSSize(width: 1920, height: 1080)   // 2× pixels on a 1920×1080 pt page
  guard let page = PDFPage(image: img) else { fatalError("cannot make page \(i)") }
  let jsonURL = linkDir.appendingPathComponent(url.deletingPathExtension().lastPathComponent + ".json")
  if let data = try? Data(contentsOf: jsonURL), let links = try? JSONDecoder().decode([Link].self, from: data) {
    for l in links where l.w > 0 && l.h > 0 {
      // CSS px == PDF pt here; PDF origin is bottom-left
      let a = PDFAnnotation(bounds: CGRect(x: l.x, y: 1080 - l.y - l.h, width: l.w, height: l.h), forType: .link, withProperties: nil)
      a.url = URL(string: l.href)
      let b = PDFBorder(); b.lineWidth = 0; a.border = b
      page.addAnnotation(a)
      total += 1
    }
  }
  doc.insert(page, at: i)
}
doc.documentAttributes = [PDFDocumentAttribute.titleAttribute: "truex · Introduction deck · October 2026 · elevated"]
guard doc.write(to: out) else { fatalError("write failed") }
print("wrote \(out.path) · \(doc.pageCount) pages · \(total) links")
EOF
