#!/bin/sh
# Screenshot slides at 1920×1080.  Usage: ./render.sh [NN ...]   (no args = all slides)
# Writes build/png/NN.png. Run `python3 build.py` first.
# Headless Chrome on macOS sometimes writes the PNG and then never exits, so each
# render is watched and killed once the file appears (or after 40s).
set -eu
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p build/png
if [ $# -eq 0 ]; then
  set -- $(ls build | sed -n 's/^slide-\([0-9][0-9]\)\.html$/\1/p')
fi
for n in "$@"; do
  out="$PWD/build/png/$n.png"
  rm -f "$out"
  profile=$(mktemp -d)  # own profile so parallel renders never collide
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --no-first-run --no-default-browser-check --user-data-dir="$profile" \
    --virtual-time-budget=5000 --window-size=1920,1080 \
    --screenshot="$out" "file://$PWD/build/slide-$n.html" >/dev/null 2>&1 &
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
  if [ -s "$out" ]; then echo "$out"; else echo "FAILED $n" >&2; fi
done
