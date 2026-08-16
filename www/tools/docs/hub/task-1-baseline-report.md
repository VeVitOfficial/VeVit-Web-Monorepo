# VeVit Tools Hub — Task 1 baseline report

## Identifikace

- Projekt: `/home/vitekeee/Projects/VeVit_tools`
- Záloha před změnami: `/home/vitekeee/Backups/vevit-tools-pre-hub-task-1-20260729-032932/vevit-tools-complete.tar.gz`
- SHA-256 manifest: `/home/vitekeee/Backups/vevit-tools-pre-hub-task-1-20260729-032932/SHA256SUMS`
- SHA-256 archivu: `98e86e44e1d0ab5143cd80eb55f4a9f988404b0c55864761cdccd5b597df2563`
- Testovací běh: 2026-07-29 01:36:34–01:36:35 UTC
- PHP: `PHP 8.5.8 (cli)`
- Python: `Python 3.14.6`
- GitHub: nebyl změněn; nebyl vytvořen push, vzdálený commit, pull request ani komentář.

## Výsledek inventory

| Kontrola | Výsledek |
| --- | ---: |
| Registrované položky | 107 |
| Unikátní slugy | 107 |
| Renderované detailní routy | 107 |
| Unikátní slugy v `tools.json` | 107 |
| Karty v `index.html` | 115 |
| Šablony aktivních nástrojů | 104 |
| JavaScripty aktivních nástrojů | 104 |
| Informační nástroje | 3 |

Rozdíl mezi 107 nástroji a 115 kartami je očekávaný: osm položek se navíc
opakuje v prezentační sekci „Nejnovější“. Nejde o duplicitní registry ani JSON
dataset.

Rozdělení statusů: 91 `working`, 13 `limited`, 2 `unavailable_on_wedos` a 1
`coming_soon`. Všech 107 položek má po úspěšném Tasku 1 pouze
`verified_test_level: structural`; browser smoke ani happy-path nejsou tímto
reportem předstírány.

Informační nástroje jsou `pdf-password`, `screenshot-tool` a `ai-image-gen`.
Všechny jejich routy vrací 200, zobrazují informační stav, nenačítají chybějící
skript a nejsou započítány jako `working`.

## Datový a generační stav

- `includes/registry.php` je kanonický zdroj.
- `php scripts/export-tools.php` validuje schema, enumy a logické kombinace,
  potom atomicky vytvoří `assets/data/tools.json` a `tools-index.json`.
- `php scripts/export-tools.php --check` ověří shodu bez zápisu.
- `python3 scripts/generate-index.py` čte jen `tools-index.json`; při jeho
  nepřítomnosti test prokázal selhání bez přepsání původního `index.html`.
- `index.html` i oba datasety byly ověřeny jako deterministické.

Žádný deklarovaný asset ani implementační soubor nechybí. Dva soubory s
příponou `.partial` zůstaly zachovány jako dříve označené nejasné lokální
pozůstatky (`ffmpeg-core.wasm…partial`, `ort-wasm…partial`); nejsou deklarované
jako aktivní assety a Task 1 je nemaže.

## Spuštěné kontroly

| Typ | Příkaz / kontrola | Výsledek |
| --- | --- | --- |
| Automatická | `php tests/hub/registry-test.php` | PASS (exit 0) — schema, enumy, kombinace, ikony, 107 slugů |
| Automatická | `php tests/hub/assets-test.php` | PASS (exit 0) — 104 šablon, 104 skriptů, veřejné soubory bez Store/secrets |
| Automatická | `php tests/hub/security-baseline-test.php` | PASS (exit 0) — HTML→PDF, SSL, feedback, AI model allowlist |
| Automatická | `php tests/hub/export-test.php` | PASS (exit 0) — determinismus a `--check` |
| Automatická | `php tests/hub/index-generation-test.php` | PASS (exit 0) — 107 unikátních slugů, 115 karet, atomické selhání |
| Automatická | `php tests/hub/route-smoke-test.php` | PASS (exit 0) — 107 rout, 404 pro neznámý a traversal slug |
| Automatická | `php tests/ssl-checker-test.php` | PASS (exit 0) |
| Automatická | `php tests/request-rate-limit-test.php` | PASS (exit 0) |
| Automatická | `find … -name '*.php' -print0 \| xargs -0 -n1 php -l` | PASS (exit 0) — 129 PHP souborů |
| Automatická | `python3 -m py_compile scripts/generate-index.py` | PASS (exit 0) |
| Statická | `node --check` pro neminifikované soubory v `assets/js` | PASS (exit 0); Node je pouze vývojová kontrola |
| Automatická | `php scripts/export-tools.php --check` | PASS (exit 0) |
| Automatická | `python3 scripts/generate-index.py` | PASS (exit 0) |
| Automatická | `git diff --check` | PASS (exit 0) |

Strojově čitelný výstup s časy, návratovými kódy a jednotlivými příkazy je v
`reports/hub-tool-baseline.json`.

## Bezpečnostní regrese

Kontrola ověřila, že HTML→PDF používá sanitizovaný sandboxovaný iframe místo
vložení vstupu do hlavního DOMu; SSL checker zapíná ověření řetězce i hostname a
odmítá neveřejné IP; feedback vrací úspěch až po potvrzení `mail()`; AI proxy
odmítá klientský parametr modelu a vybírá model na serveru. Veřejné exporty a
landing neobsahují nalezený service-role, Stripe ani AI secret.

## Omezení a další práce

- Browser smoke, mobilní overflow a WCAG manuální/browserské ověření jsou
  plánované až v dalších tascech.
- Happy-path testy nástrojů nejsou provedené; status `working` není v tomto
  Tasku 1 tvrzením o dokončeném happy-path testu.
- Neproběhlo připojení k externí AI/Ollama ani k VeVit-account.
- Nebyl proveden redesign, account UI, nové search UX, filtry ani localStorage
  preference.
- Nebyla přidána Node.js produkční závislost, Store, Stripe ani databázová
  změna.
