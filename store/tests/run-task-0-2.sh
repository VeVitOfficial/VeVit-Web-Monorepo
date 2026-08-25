#!/usr/bin/env bash
set -euo pipefail

php tests/unit/checkout-snapshot-test.php
php tests/unit/csrf-test.php
php tests/integration/checkout-snapshot-postgres-test.php || {
  status=$?
  if [ "$status" -ne 77 ]; then
    exit "$status"
  fi
}
