#!/bin/sh
# Export truex-introduction-deck-minimal.pdf from 2× screenshots of each slide.
# Chrome's print-to-PDF flattens box-shadows, drop-shadow filters and backdrop blur into
# gray boxes, so the PDF is assembled from screenshots instead (pixel-identical to the deck).
# Usage: python3 build.py && ./make-pdf.sh
set -eu
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p build/png2x
for f in build/slide-*.html; do
  n=$(basename "$f" .html | sed 's/slide-//')
  out="$PWD/build/png2x/$n.png"
  rm -f "$out"
  profile=$(mktemp -d)
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --no-first-run --no-default-browser-check --user-data-dir="$profile" \
    --virtual-time-budget=5000 --window-size=1920,1080 \
    --screenshot="$out" "file://$PWD/$f" >/dev/null 2>&1 &
  pid=$!
  i=0
  while kill -0 "$pid" 2>/dev/null && [ $i -lt 80 ]; do
    if [ -s "$out" ]; then sleep 1; break; fi
    sleep 0.5; i=$((i + 1))
  done
  kill "$pid" 2>/dev/null || true
  pkill -f "user-data-dir=$profile" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  rm -rf "$profile"
  [ -s "$out" ] || { echo "FAILED slide $n" >&2; exit 1; }
done

swift - "$PWD/build/png2x" "$PWD/truex-introduction-deck-minimal.pdf" <<'EOF'
import AppKit
import PDFKit
let dir = URL(fileURLWithPath: CommandLine.arguments[1])
let out = URL(fileURLWithPath: CommandLine.arguments[2])
let files = try FileManager.default.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil)
  .filter { $0.pathExtension == "png" }.sorted { $0.lastPathComponent < $1.lastPathComponent }
let doc = PDFDocument()
for (i, url) in files.enumerated() {
  guard let img = NSImage(contentsOf: url) else { fatalError("cannot read \(url.path)") }
  img.size = NSSize(width: 1920, height: 1080)   // 2× pixels on a 1920×1080 pt page
  guard let page = PDFPage(image: img) else { fatalError("cannot make page \(i)") }
  doc.insert(page, at: i)
}
doc.documentAttributes = [PDFDocumentAttribute.titleAttribute: "truex · Introduction deck (minimal) · October 2026"]
guard doc.write(to: out) else { fatalError("write failed") }
print("wrote \(out.path) · \(doc.pageCount) pages")
EOF
