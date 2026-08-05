#!/usr/bin/env bash
set -euo pipefail

base_url="${VEVIT_BASE_URL:-https://vevit.cz}"
failures=0

check() {
  local application="$1"
  local path="$2"
  local code
  code="$(curl --silent --show-error --location --max-redirs 5 \
    --connect-timeout 10 --max-time 30 --output /dev/null \
    --write-out '%{http_code}' "${base_url}${path}")" || code="000"
  if [[ "$code" == "200" ]]; then
    printf 'PASS %-8s %s -> 200\n' "$application" "$path"
  else
    printf 'FAIL %-8s %s -> %s (ocekavano 200)\n' "$application" "$path" "$code" >&2
    failures=$((failures + 1))
  fi
}

# /account/ zamerne nema verejny index; login je jeho klicova verejna cesta.
check account /account/login
check store /store/
check tools /tools/
check edu /edu/
check home /home/

if (( failures > 0 )); then
  exit 1
fi

printf 'production-smoke-test: PASS\n'
