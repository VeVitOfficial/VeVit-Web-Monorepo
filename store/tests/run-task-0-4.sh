#!/usr/bin/env bash
set -euo pipefail

php tests/unit/money-test.php
php tests/unit/snapshot-integrity-test.php
php tests/unit/order-state-machine-test.php
php tests/unit/stripe-webhook-verifier-test.php
php tests/unit/stripe-checkout-metadata-test.php
php tests/unit/payment-flow-regression-test.php
php tests/unit/public-product-api-test.php
php tests/integration/enum-extension-postgres-test.php
php tests/integration/migrations-postgres-test.php
php tests/integration/rate-limit-postgres-test.php
php tests/integration/payment-flow-postgres-test.php
