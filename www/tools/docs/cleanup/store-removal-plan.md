# VeVit Store removal plan

## Audit and recovery point

Project: `/home/vitekeee/Projects/VeVit_tools`  
Git audit: usable local metadata on `master` at `241868a905963d27c1072089d2f9385b7bfdd4c9`; working tree was clean before this plan. No remote operation is authorized.  
Complete backup: `/home/vitekeee/Backups/vevit-tools-pre-store-removal-20260729-030200/vevit-tools-complete.tar.gz`  
SHA-256 manifest: `/home/vitekeee/Backups/vevit-tools-pre-store-removal-20260729-030200/SHA256SUMS`

The archive includes the full project, including current local Git metadata. No
file is removed until this archive and its checksum are created and checked.

## Classification

| Classification | Paths | Decision |
| --- | --- | --- |
| VEVIT_STORE | `app/`, `config/`, `store/`, `storage/`, `.env.example`, `docs/release-0/`, `docs/store-architecture.md`, `tests/bootstrap/`, `tests/config/`, `tests/http/`, `tests/security/`, `tests/session/` | Remove after dependency check. |
| SHARED_MODIFIED | `.htaccess`, `router.php` | Remove only Store route and Store-only protection; retain general security and Tools routes. |
| VEVIT_TOOLS | `includes/`, `api/`, `assets/`, `scripts/`, `tools.php`, `index.html`, `README.md` | Preserve; audit and test. |
| UNKNOWN | `.claude/settings.local.json` | Preserve: user-local tool configuration, not production content. |
| UNKNOWN / removable after evidence | `package-lock.json`, `test.txt`, `assets/js/lib/pdf.min.js.d1171791.partial` | Remove only after proving no reference/use. |

## Removal and restoration plan

1. Check that no non-Store Tools source requires Store paths. This has been
   limited to the Store route and Store documentation/bootstrap references.
2. Delete only confirmed Store directories and files listed above.
3. Manually edit `.htaccess` and `router.php`; never overwrite them from a
   historical snapshot. Keep generic protection for `.env`, logs and backups.
4. Remove unused lock/test/partial files only after reference scan; preserve the
   complete `pdf.min.js` and PDF worker used by real PDF tools.
5. Regenerate and test the 107-tool landing and routes. If a removal breaks a
   Tools feature, restore the specific path from the complete backup archive.

## Risks

* The local Git history labels the current snapshot as a faulty application;
  it is not used as a restoration source. The external archive is the recovery
  point.
* `pdf.min.js.d1171791.partial` has the same size as the actual complete PDF.js
  asset but is not referenced; deleting it must not affect the real asset.
* Tools security fixes are not Store infrastructure and must be retained even
  if introduced in the same period.
