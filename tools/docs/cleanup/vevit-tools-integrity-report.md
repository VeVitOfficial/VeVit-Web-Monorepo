# VeVit Tools integrity report

## Registry and intentional information states

The canonical registry contains **107 unique tools** in valid categories with
registered icons. There are 104 implementation template/script pairs. The three
intentional information-only tools are:

| Tool | State | Reason |
| --- | --- | --- |
| `pdf-password` | unavailable on shared WEDOS | qpdf and `shell_exec` require VPS/external service. |
| `screenshot-tool` | unavailable on shared WEDOS | headless Chromium plus SSRF-safe isolation is required. |
| `ai-image-gen` | preparing | no approved image provider or infrastructure exists. |

Their details render a truthful informational state and do not expose upload or
action controls.

## Automated checks

```bash
php -r 'require "includes/registry.php"; /* verify 107 unique slugs/categories/icons */'
php -S 127.0.0.1:3960 router.php
php -r '/* request all 107 /tools/<slug> routes */'
php scripts/export-tools.php
python3 scripts/generate-index.py
python3 -m py_compile scripts/generate-index.py
find . -name "*.php" -not -path "./.git/*" -print0 | xargs -0 -n1 php -l
find assets/js -name "*.js" ! -name "*.min.js" -print0 | xargs -0 -n1 node --check
```

Executed results: registry 107/107, route smoke 107/107 HTTP 200 without fatal
PHP error, deterministic index regeneration, PHP lint and JavaScript syntax all
passed. `/store/api/health` returned 404 after removal.

## Known limitations

Browser console and mobile-overflow checks are not fully automated in this local
run. The two non-PDF `.partial` assets are preserved as UNKNOWN pending a
dedicated dependency audit. AI/Ollama remains development infrastructure and is
not compatible with shared WEDOS without an approved external design.
