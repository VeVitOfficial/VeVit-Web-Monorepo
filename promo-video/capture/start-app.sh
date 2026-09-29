#!/usr/bin/env bash
# Spustí mock Supabase (port 54321) a Next.js aplikaci (port 3000) proti němu.
# Použití: bash promo-video/capture/start-app.sh [log-dir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="${1:-$ROOT/promo-video/.cache}"
mkdir -p "$LOG_DIR"
cd "$ROOT"
nohup node promo-video/capture/mock-supabase.mjs > "$LOG_DIR/mock.log" 2>&1 &
echo $! > "$LOG_DIR/mock.pid"
TZ=Europe/Prague \
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SECRET_KEY=sb_secret_dummy-promo-mock \
NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
nohup npx next dev -p 3000 > "$LOG_DIR/next.log" 2>&1 &
echo $! > "$LOG_DIR/next.pid"
for _ in $(seq 1 60); do
  if curl -s -o /dev/null http://localhost:3000/api/health; then echo "Aplikace běží na http://localhost:3000"; exit 0; fi
  sleep 2
done
echo "Aplikace nenastartovala, viz $LOG_DIR/next.log" >&2
exit 1
