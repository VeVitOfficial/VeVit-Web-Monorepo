# Stable VeVit Tools Hub checkpoint

This local checkpoint includes validated registry exports, static index
generation, unique structured search with filters and URL state, and small
mobile/focus stability fixes. It excludes VeVit Store, Stripe, Account/SSO,
favourites, Supabase sync and new AI providers. Production remains classic
PHP/HTML/CSS/JavaScript for WEDOS; Node is used only for development syntax and
unit checks.

Run locally: `php -S 127.0.0.1:3972 router.php`.

Quick verification: `php tests/hub/run-task-1.php && node tests/hub/search-test.js && php scripts/export-tools.php --check && python3 scripts/generate-index.py && git diff --check`.

Rollback: restore the archive at
`/home/vitekeee/Backups/vevit-tools-pre-stable-hub-20260729-034731/vevit-tools-complete.tar.gz`,
then regenerate exports and index. GitHub was not changed.
