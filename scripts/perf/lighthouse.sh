#!/usr/bin/env bash
# Lighthouse (mobile preset, jen Performance) pro hlavní routy, RUNS běhů, výstup = medián.
# Použití: bash scripts/perf/lighthouse.sh <výstupní-adresář> [base-url] [runs]
# Server musí běžet v produkčním režimu (npm run build && npx next start -p 3100).
set -u
OUT="$1"; BASE="${2:-http://localhost:3100}"; RUNS="${3:-3}"; mkdir -p "$OUT"
export CHROME_PATH="${CHROME_PATH:-/usr/bin/chromium}"
URLS=(/cs/home /cs/tools /cs/tools/pdf-merge /cs/edu /cs/edu/ai-gramotnost /cs/store /cs/services /cs/account/login)
for u in "${URLS[@]}"; do
  name=$(echo "$u" | sed 's#/#_#g')
  for r in $(seq 1 "$RUNS"); do
    npx --yes lighthouse@12.8.2 "$BASE$u" --quiet --only-categories=performance \
      --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="$OUT/$name.$r.json" >/dev/null 2>&1 || echo "FAIL $u run $r"
  done
done
node -e '
const fs=require("fs"),d=process.argv[1];
const groups={};
for(const f of fs.readdirSync(d).filter(f=>f.endsWith(".json"))){const k=f.replace(/\.\d+\.json$/,"");(groups[k]??=[]).push(JSON.parse(fs.readFileSync(d+"/"+f)))}
const med=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};
const n=(r,k)=>r.audits[k].numericValue;
console.log("| URL | Perf | FCP s | LCP s | TBT ms | CLS | SI s |\n|---|---:|---:|---:|---:|---:|---:|");
for(const [k,rs] of Object.entries(groups)){
  const p=new URL(rs[0].finalDisplayedUrl).pathname;
  console.log(`| ${p} | ${med(rs.map(r=>Math.round(r.categories.performance.score*100)))} | ${(med(rs.map(r=>n(r,"first-contentful-paint")))/1000).toFixed(1)} | ${(med(rs.map(r=>n(r,"largest-contentful-paint")))/1000).toFixed(1)} | ${Math.round(med(rs.map(r=>n(r,"total-blocking-time"))))} | ${med(rs.map(r=>n(r,"cumulative-layout-shift"))).toFixed(3)} | ${(med(rs.map(r=>n(r,"speed-index")))/1000).toFixed(1)} |`)}' "$OUT"
