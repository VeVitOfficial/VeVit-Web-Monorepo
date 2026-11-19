#!/usr/bin/env bash
set -euo pipefail

base_url="${VEVIT_BASE_URL:-https://vevit.cz}"
failures=0

check() {
  local application="$1"
  local path="$2"
  local headers code
  headers="$(mktemp)"
  code="$(curl --silent --show-error --location --max-redirs 5 \
    --connect-timeout 10 --max-time 30 --output /dev/null \
    --dump-header "$headers" --write-out '%{http_code}' "${base_url}${path}")" || code="000"
  if [[ "$code" == "200" ]] && grep -qi '^content-security-policy-report-only:' "$headers"; then
    printf 'PASS %-8s %s -> 200 + CSP-RO\n' "$application" "$path"
  else
    printf 'FAIL %-8s %s -> %s (ocekavano 200 + CSP-RO)\n' "$application" "$path" "$code" >&2
    failures=$((failures + 1))
  fi
  rm -f "$headers"
}

# /account/ zamerne nema verejny index; login je jeho klicova verejna cesta.
check account /account/login
check store /store/
check tools /tools/
check edu /edu/
check home /home/

collector_code="$(curl --silent --show-error --connect-timeout 10 --max-time 30 \
  --request POST --header 'Content-Type: application/csp-report' --output /dev/null \
  --write-out '%{http_code}' --data \
  '{"csp-report":{"document-uri":"https://vevit.cz/__csp_smoke__","blocked-uri":"inline","effective-directive":"script-src-elem"}}' \
  "${base_url}/account/api/csp-report.php")" || collector_code="000"
if [[ "$collector_code" == "204" ]]; then
  printf 'PASS csp-report collector -> 204\n'
else
  printf 'FAIL csp-report collector -> %s (ocekavano 204)\n' "$collector_code" >&2
  failures=$((failures + 1))
fi

if (( failures > 0 )); then
  exit 1
fi

printf 'production-smoke-test: PASS\n'
