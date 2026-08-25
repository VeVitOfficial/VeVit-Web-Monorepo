# CSP report-only — podklad pro S-2

Stav k 5. 8. 2026 03:07 CEST. Tento dokument odděluje lokálně ověřený kontrakt od
produkčního report-only sběru. Enforce nebyl zapnut.

## Lokální ověření

- `security-preflight-static-test`: bez inline skriptů/handlerů a bez
  zakázaných eval sinků v 564 kontrolovaných zdrojích.
- XSS browser testy pro Edu/Wikipedia, Store a Tools markdown jsou zelené.
- Nginx kontrakt obsahuje `Content-Security-Policy-Report-Only`, jednotné
  bezpečnostní hlavičky a endpoint `/account/api/csp-report.php`.
- FFmpeg nástroje zůstávají fail-closed, protože Chromium pod striktním
  `script-src 'self'` blokuje WebAssembly kompilaci bez další CSP výjimky.

## Produkční sběr

Sběr byl spuštěn 5. 8. 2026 v 03:05 CEST na aktivním WEDOS Apache/PHP stacku.
Nejdřívější datum S-2 je 12. 8. 2026 po 03:05 CEST; interval zahrnuje víkend
8.–9. 8. Enforce zůstává vypnutý.

| Cesta | HTTP | CSP report-only | CSP enforce |
|---|---:|---|---|
| `/account/login` | 200 | ano | ne |
| `/store/` | 200 | ano | ne |
| `/tools/` | 200 | ano | ne |
| `/edu/` | 200 | ano | ne |
| `/home/` | 200 | ano | ne |

Collector je dostupný pouze pro POST, normalizuje URL bez query parametrů,
deduplikuje podle `document-uri + blocked-uri + directive`, agreguje počty v
denních souborech mimo webroot, limituje klienta na 120 reportů/minutu a drží
14denní retenci. Produkční smoke jej každých 15 minut ověřuje zvláštním
`/__csp_smoke__` záznamem, který se do vyhodnocení violations nezapočítá.

Aktuální soubor byl po dvou záměrných shodných probech ověřen jako jediný
agregovaný záznam; reprezentativní provozní počet zatím není k dispozici.

### První syntetický průchod (03:09 CEST)

Po odečtení smoke záznamu zachytil 11 unikátních violations / 12 výskytů:

- Account: 8× vzdálený Google font, 1× Google Fonts stylesheet, 1× inline
  script.
- Store: 2× inline script.
- Tools, Edu a Home: při prvním průchodu bez reportu.

Příčinou byl produkční drift: Account a Store měly starší HTML/asset verze než
autoritativní repo. Lokální fonty a aktuální externí JS byly nasazeny; opakovaný
browser průchod už tyto zdroje nepřidal. Historické počty zůstávají v denním
agregátu a při finálním vyhodnocení se označí jako opravené, nikoli smažou.

### Průběžná kontrola (03:18 CEST)

- Všech pět klíčových cest: HTTP 200, přesně jedna CSP-RO hlavička, žádná
  enforce hlavička.
- Collector: HTTP 204.
- Browserový průchod odhalil další produkční drift pouze na Home:
  `cdn.tailwindcss.com`, `unpkg.com/lucide@latest` a 404 z legacy
  `/api/auth/me.php`.
- Autoritativní repo už používá statický Tailwind, lokální Lucide a
  `/account/api/me.php`; chybné legacy `home/api/user.php` bylo opraveno
  test-first a `home/tests/account-sso-test.php` je zelený.
- Produkční upload této Home opravy čeká na nové přihlášení k WEDOS/WebFTP;
  předchozí session byla po práci bezpečně uzavřena a lokálně není uložené FTP
  heslo. S-2 zůstává blokované, dokud po nasazení Home neproběhne nový průchod.

## Známé violations a blokery

| Oblast | Zbývající violation | Blokuje S-2 |
|---|---|---|
| Lokální regresní sada | žádná reprodukovaná script/XSS violation | ne |
| Produkční provoz | sedmidenní vzorek právě běží | ano, do 12. 8. 2026 |
| `/store/` | obnoveno na HTTP 200, hlavička ověřena | ne |
| `/home/` | starý Tailwind CDN, unpkg Lucide a legacy auth route | ano, čeká na produkční upload |
| Inline styly | povolené dokumentovanou výjimkou `style-src 'self' 'unsafe-inline'` | ne |
| FFmpeg/WASM | funkce je fail-closed; zapnutí by vyžadovalo nepovolenou CSP výjimku nebo izolovaný origin | ne pro SSO |
| Stripe webhook | secret vyměněn, testovací event doručen 200 | ne |

## Podmínky pro S-2

1. Dokončit nejméně sedm dní sběru na všech pěti aplikacích.
2. Roztřídit každý report podle directive, URL a zdroje; odstranit skutečné
   violations bez rozšíření `script-src`.
3. Teprve potom požádat o S-2 a přepnout report-only na enforce.
