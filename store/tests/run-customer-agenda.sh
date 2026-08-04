#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${DB_DSN:-}" && -z "${VEVIT_STORE_TEST_DSN:-}" ]]; then
  echo "REFUSE: DB_DSN is never used for destructive customer-agenda tests; set VEVIT_STORE_TEST_DSN explicitly." >&2
  exit 1
fi
: "${VEVIT_STORE_TEST_DSN:?VEVIT_STORE_TEST_DSN is required}"
: "${VEVIT_STORE_TEST_DB_USER:?VEVIT_STORE_TEST_DB_USER is required}"
: "${VEVIT_STORE_TEST_DB_PASS:?VEVIT_STORE_TEST_DB_PASS is required}"
if [[ "$VEVIT_STORE_TEST_DSN" != pgsql:* || "$VEVIT_STORE_TEST_DSN" != *test* ]]; then
  echo "REFUSE: VEVIT_STORE_TEST_DSN must be a PostgreSQL test database." >&2
  exit 1
fi
if [[ "$VEVIT_STORE_TEST_DSN" == *supabase.co* || "$VEVIT_STORE_TEST_DSN" == *pooler.supabase.com* ]]; then
  echo "REFUSE: Supabase production-like hosts are not permitted for destructive tests." >&2
  exit 1
fi

for test_file in tests/unit/*.php; do
  php "$test_file"
done

integration_tests=(
  tests/integration/config-missing-secret-test.php
  tests/integration/enum-extension-postgres-test.php
  tests/integration/migrations-postgres-test.php
  tests/integration/checkout-snapshot-postgres-test.php
  tests/integration/order-download-postgres-test.php
  tests/integration/rate-limit-postgres-test.php
  tests/integration/payment-flow-postgres-test.php
  tests/integration/customer-agenda-preflight-postgres-test.php
  tests/integration/customer-agenda-migrations-postgres-test.php
  tests/integration/customer-agenda-server-role-postgres-test.php
  tests/integration/customer-agenda-migration-runner-postgres-test.php
  tests/integration/migration-runner-postgres-test.php
  tests/integration/customer-agenda-down-guard-postgres-test.php
  tests/integration/claim-service-postgres-test.php
  tests/integration/return-service-postgres-test.php
  tests/integration/delivery-service-postgres-test.php
  tests/integration/attachment-service-postgres-test.php
  tests/integration/favorite-service-postgres-test.php
  tests/integration/customer-agenda-transitions-postgres-test.php
  tests/integration/case-quantity-concurrency-postgres-test.php
)
for test_file in "${integration_tests[@]}"; do
  docker run --rm --network vevit-customer-agenda-net -v "$PWD:/app" -w /app \
    -e VEVIT_STORE_TEST_DSN="$VEVIT_STORE_TEST_DSN" \
    -e VEVIT_STORE_TEST_DB_USER="$VEVIT_STORE_TEST_DB_USER" \
    -e VEVIT_STORE_TEST_DB_PASS="$VEVIT_STORE_TEST_DB_PASS" \
    vevit-task04-php php "$test_file"
done

VEVIT_STORE_TEST_DSN="$VEVIT_STORE_TEST_DSN" \
VEVIT_STORE_TEST_DB_USER="$VEVIT_STORE_TEST_DB_USER" \
VEVIT_STORE_TEST_DB_PASS="$VEVIT_STORE_TEST_DB_PASS" \
bash tests/run-customer-agenda-http.sh

find . -path './lib/stripe-php' -prune -o -path './.git' -prune -o -name '*.php' -type f -print0 | xargs -0 -n1 php -l >/dev/null
for js_file in assets/js/*.js; do node --check "$js_file"; done
echo "PASS: customer agenda full gate"
