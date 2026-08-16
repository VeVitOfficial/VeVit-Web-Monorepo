# VeVit Tools Hub — Task 1: baseline a validační základ

## Rozsah

Task 1 nemění vizuální podobu landing page, hero, karty, mobilní navigaci,
account UI, oblíbené/nedávné položky ani finální UX vyhledávání. Zavádí pouze
ověřitelný datový kontrakt, deterministické generování a testovací základ pro
další tasky VeVit Tools.

## Záloha před změnami

- Projekt: `/home/vitekeee/Projects/VeVit_tools`
- Archiv: `/home/vitekeee/Backups/vevit-tools-pre-hub-task-1-20260729-032932/vevit-tools-complete.tar.gz`
- SHA-256 manifest: `/home/vitekeee/Backups/vevit-tools-pre-hub-task-1-20260729-032932/SHA256SUMS`
- SHA-256 archivu: `98e86e44e1d0ab5143cd80eb55f4a9f988404b0c55864761cdccd5b597df2563`

## Kontrakt registry

Kanonickým zdrojem je `includes/registry.php`. Každý nástroj musí mít `slug`,
`name`, `description`, `category`, `processing_location`, `icon`, `new`,
`keywords`, `aliases`, `status`, `availability`, `requirements`,
`privacy_note` a `declared_test_target`.

`requirements` má vždy pole `browser_features`, `local_assets`,
`php_extensions`, `external_services`, `hosting_constraints` a boolean
`verified`. Prázdné neověřené údaje nejsou domněnkou o závislostech.

Registry neobsahuje `verified_test_level`. Skutečně dosažená úroveň vzniká
výhradně v `reports/hub-tool-baseline.json`, je navázána na digest registry a
exportér ji jinak nastaví na `none`.

Povolené kombinace jsou:

- `working` + `available`
- `limited` + `requires_external_service` nebo `requires_browser_support`
- `experimental` + `available` nebo `requires_external_service`
- `coming_soon` + `not_implemented` nebo `requires_external_service`
- `unavailable_on_wedos` + `unavailable_on_wedos`
- `broken` nesmí mít `available`, pokud nemá explicitní vysvětlení.

## Generování

`php scripts/export-tools.php` validuje registry a atomicky zapisuje:

- `assets/data/tools.json` — veřejný klientský dataset;
- `assets/data/tools-index.json` — rozšířený, ale stále veřejný strukturovaný
  artefakt s ikonami pouze pro statický generátor.

`php scripts/export-tools.php --check` nic nezapisuje a ověří přesnou shodu
obou souborů s kanonickým exportem. JSON je deterministický a používá UTF-8
bez escapování české diakritiky.

`python3 scripts/generate-index.py` čte pouze `tools-index.json`; nespouští ani
neparsuje PHP. Pokud export chybí nebo je neplatný, index nevytvoří ani
nepřepíše. Zápis `index.html` je atomický.

## Testy

`tests/hub/run-task-1.php` spustí validační, exportní, assetové, bezpečnostní
a route smoke kontroly a po úspěchu atomicky zapíše ověřené strukturální úrovně
do reportu. Browser smoke a happy-path testy nejsou součástí tohoto tasku.

Předpoklad počtu nástrojů je uložen v `tests/hub/baseline.php` s odůvodněním:
107 unikátních slugů. Generovaný index obsahuje více vizuálních karet, protože
sekce Nejnovější opakuje podmnožinu nástrojů; test ověřuje obě hodnoty zvlášť.

## Bezpečnostní hranice

Task pouze regresně kontroluje existující hardening HTML→PDF, SSL checkeru,
feedback endpointu a AI proxy. Nezavádí nové externí služby, secrets, Node.js,
Store ani account-side konfiguraci. Všechny práce zůstávají lokální; GitHub se
nemění.
