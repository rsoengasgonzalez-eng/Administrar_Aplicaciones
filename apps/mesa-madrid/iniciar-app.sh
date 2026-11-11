#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
( sleep 1; command -v xdg-open >/dev/null && xdg-open http://127.0.0.1:8080 >/dev/null 2>&1 || true ) &
python3 -m http.server 8080
