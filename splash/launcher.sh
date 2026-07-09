#!/usr/bin/env bash
# Launches the session splash screen in a borderless Chromium window.
# Usage: launcher.sh [username]
# The hook script should write progress lines to /tmp/42-session-splash
# Protocol: status:message (e.g., "progress:mounting your home...", "done:ready")

SPLASH_DIR="$(dirname "$(readlink -f "$0")")"
USERNAME="${1:-}"

# Clear any previous progress file
: > /tmp/42-session-splash

# Find chromium or google-chrome
BROWSER=""
for bin in chromium-browser chromium google-chrome google-chrome-stable; do
  if command -v "$bin" &>/dev/null; then
    BROWSER="$bin"
    break
  fi
done

if [ -z "$BROWSER" ]; then
  echo "No Chromium-based browser found, skipping splash"
  exit 0
fi

URL="file://${SPLASH_DIR}/index.html"
[ -n "$USERNAME" ] && URL="${URL}?user=${USERNAME}"

"$BROWSER" \
  --kiosk \
  --app="$URL" \
  --no-sandbox \
  --disable-gpu-sandbox \
  --window-size=1920,1080 \
  2>/dev/null &