# VeVit Store removal report

## Recovery point

Complete archive: `/home/vitekeee/Backups/vevit-tools-pre-store-removal-20260729-030200/vevit-tools-complete.tar.gz`  
SHA-256 manifest: `/home/vitekeee/Backups/vevit-tools-pre-store-removal-20260729-030200/SHA256SUMS`  
Archive SHA-256: `595a7af9e830ca561ce097bd4ba441f3870e68918382c521c464960945c2fa20`.

## Removed Store-only content

* `app/`, `config/`, `store/`, `storage/`
* `.env.example`
* `docs/release-0/`, `docs/store-architecture.md`
* `tests/bootstrap/`, `tests/config/`, `tests/http/`, `tests/security/`,
  `tests/session/`

Detailed deleted files: `.env.example`; `app/.htaccess`, `app/bootstrap.php`,
all `app/auth/*.php`, `app/config/Config.php`, `app/http/*.php`,
`app/security/Csrf.php`, `app/session/Session.php`, `app/support/*.php`;
`config/.htaccess` and `config/{app,database,logging,services,session}.php`;
`store/{index.php,api/health.php}`; `storage/.htaccess`,
`storage/logs/.gitkeep`, `storage/private/.gitkeep`; all five
`docs/release-0/task-0.*.md`, `docs/store-architecture.md`; and all Store test
files under the five removed `tests/` directories.

## Shared files manually edited

* `.htaccess`: removed Store path blocking and `/store/api/health`; retained
  generic `.env`, log, SQL dump, backup and directory-listing protections.
* `router.php`: removed Store health route and Store directory handling; retained
  generic sensitive-file protection and added decoded traversal/backslash/NUL
  rejection for the development router.

## Removed unused artifacts

* `package-lock.json`: empty lockfile with no packages; production has no Node.
* `test.txt`: empty, unreferenced temporary file.
* `assets/js/lib/pdf.min.js.d1171791.partial`: unreferenced partial duplicate;
  actual `pdf.min.js` remains.

## Restored Tools content

The following verified local-upstream assets were missing but are used by Tools:
`assets/js/site.js`, `assets/js/lib/tool-ui.js`,
`assets/js/lib/purify.min.js`, `assets/js/lib/pdf.worker.min.js`.
Their SHA-256 values were checked against `/tmp/vevit-tools-git-metadata` before
copying. The cleanup also retained/hardened Tools HTML→PDF and SSL-checker
security code, not Store infrastructure.

## Preserved unknown content

* `.claude/settings.local.json`: user-local development-tool settings; preserved.
* `assets/js/lib/ffmpeg/ffmpeg-core.wasm.809d4fa3.partial` and
  `assets/js/lib/onnx/ort-wasm-simd-threaded.wasm.1bd797d0.partial`: no direct
  reference was found, but they are not part of Store and are kept pending a
  dedicated asset audit.

No merge conflict occurred. GitHub was not changed.

## Verification summary

On 2026-07-29 locally: PHP lint, Python generator syntax, non-minified JS
syntax, registry uniqueness (107), all 107 tool routes, deterministic index
regeneration, Store-route 404 and direct-include 404 checks passed. `git diff
--check` also passed locally. Browser console/mobile-layout checks were not run
in this cleanup pass.
