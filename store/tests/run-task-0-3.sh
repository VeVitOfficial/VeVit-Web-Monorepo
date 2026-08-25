#!/usr/bin/env bash
set -euo pipefail
php tests/unit/order-access-test.php
php tests/unit/download-service-test.php
php tests/unit/order-download-regression-test.php
php tests/integration/order-download-postgres-test.php || { status=$?; [ "$status" -eq 77 ] || exit "$status"; }
