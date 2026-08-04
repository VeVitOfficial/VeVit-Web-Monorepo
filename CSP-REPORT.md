# CSP report-only — podklad pro S-2

Stav k 5. 8. 2026. Tento dokument odděluje lokálně ověřený kontrakt od
produkčního report-only sběru. Enforce nebyl zapnut.

## Lokální ověření

- `security-preflight-static-test`: bez inline skriptů/handlerů a bez
  zakázaných eval sinků v 564 kontrolovaných zdrojích.
- XSS browser testy pro Edu/Wikipedia, Store a Tools markdown jsou zelené.
- Nginx kontrakt obsahuje `Content-Security-Policy-Report-Only`, jednotné
  bezpečnostní hlavičky a endpoint `/account/api/csp-report.php`.
- FFmpeg nástroje zůstávají fail-closed, protože Chromium pod striktním
  `script-src 'self'` blokuje WebAssembly kompilaci bez další CSP výjimky.

## Produkční kontrola

| Cesta | HTTP | CSP report-only | CSP enforce |
|---|---:|---|---|
| `/` | 301 | ne | ne |
| `/account/` | 302 | ne | ne |
| `/store/` | 500 | ne | ne |
| `/tools/` | 200 | ne | ne |
| `/edu/` | 200 | ne | ne |
| `/home/` | 200 | ne | ne |

Produkce zatím neposílá report-only politiku, takže počet skutečných CSP
violations je **nezměřený**, nikoli nula. Endpoint nemůže dodat reprezentativní
data, dokud nebude nasazen Nginx include z `config/nginx/`.

## Známé violations a blokery

| Oblast | Zbývající violation | Blokuje S-2 |
|---|---|---|
| Lokální regresní sada | žádná reprodukovaná script/XSS violation | ne |
| Produkční provoz | nezměřeno — report-only hlavička není nasazená | ano |
| `/store/` | HTTP 500 před vyhodnocením CSP | ano, pro Store vzorek |
| Inline styly | povolené dokumentovanou výjimkou `style-src 'self' 'unsafe-inline'` | ne |
| FFmpeg/WASM | funkce je fail-closed; zapnutí by vyžadovalo nepovolenou CSP výjimku nebo izolovaný origin | ne pro SSO |
| Stripe webhook secret | dříve exponovaný signing secret čeká na samostatnou výměnu | bezpečnostní release blocker, ne CSP violation |

## Podmínky pro S-2

1. Nasadit aktuální Nginx routing a report-only include bez enforce.
2. Opravit produkční HTTP 500 na `/store/`.
3. Sbírat reporty nejméně sedm dní na všech pěti aplikacích.
4. Roztřídit každý report podle directive, URL a zdroje; odstranit skutečné
   violations bez rozšíření `script-src`.
5. Teprve potom požádat o S-2 a přepnout report-only na enforce.
