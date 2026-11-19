#!/bin/sh
# Renders card.html to static/img/social-card.png (1200×630) with headless Chrome.
# Needs network access for the Google Fonts. Set CHROME to override the browser path.
set -eu
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
out="$(cd ../.. && pwd)/static/img/social-card.png"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --virtual-time-budget=10000 \
  --screenshot="$out" "file://$(pwd)/card.html"
echo "wrote $out"
