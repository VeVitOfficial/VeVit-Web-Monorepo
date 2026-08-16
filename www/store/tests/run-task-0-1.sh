#!/usr/bin/env bash
set -euo pipefail

php tests/unit/config-test.php
php tests/unit/session-test.php
php tests/unit/http-test.php
php tests/integration/config-missing-secret-test.php
