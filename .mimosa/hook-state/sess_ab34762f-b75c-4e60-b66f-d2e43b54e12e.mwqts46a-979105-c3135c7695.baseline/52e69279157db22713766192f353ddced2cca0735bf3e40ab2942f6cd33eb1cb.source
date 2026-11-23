#!/usr/bin/env bash
set -euo pipefail

workspace_dir=$(cd "$(dirname "$0")/.." && pwd)
result=$(/usr/bin/chromium --headless --no-sandbox --disable-gpu --disable-dev-shm-usage --dump-dom "file://${workspace_dir}/tests/tools-markdown-browser-fixture.html" 2>/dev/null)
if [[ "$result" != *'data-status="pass"'* ]]; then
  printf '%s\n' "$result"
  printf 'tools-markdown-browser-test: FAIL\n' >&2
  exit 1
fi
printf 'tools-markdown-browser-test: PASS\n'
