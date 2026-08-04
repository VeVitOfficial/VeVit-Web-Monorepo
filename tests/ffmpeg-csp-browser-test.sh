#!/usr/bin/env bash
set -euo pipefail

workspace_dir=$(cd "$(dirname "$0")/.." && pwd)
test_port=18765
php -S "127.0.0.1:${test_port}" -t "$workspace_dir" >"${TMPDIR:-/tmp}/vevit-ffmpeg-test.log" 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT

for _ in {1..20}; do
  if curl --fail --silent "http://127.0.0.1:${test_port}/tests/ffmpeg-csp-browser-fixture.html" >/dev/null; then break; fi
  sleep 0.1
done

result=$(/usr/bin/chromium --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --virtual-time-budget=60000 --dump-dom "http://127.0.0.1:${test_port}/tests/ffmpeg-csp-browser-fixture.html" 2>/dev/null)
if [[ "$result" != *'data-status="wasm-blocked"'* ]]; then
  printf '%s\n' "$result"
  printf 'ffmpeg-csp-browser-test: FAIL\n' >&2
  exit 1
fi
printf 'ffmpeg-csp-browser-test: PASS (WebAssembly blocked by strict CSP)\n'
