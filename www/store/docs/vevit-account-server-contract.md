# Požadovaná specifikace serverového kontraktu VeVit Account

Tento dokument není popisem hotového API. Je to blokující seznam údajů, které
musí VeVit Account tým dodat, bezpečnostně zreviewovat a zpřístupnit v testovacím
prostředí. Do té doby `AuthContextFactory` vrací anonymní kontext.

## Požadované rozhodnutí

- způsob předání browser session bez kopírování tokenu do URL nebo JavaScriptu;
- přesný server-to-server ověřovací endpoint, HTTP metoda a TLS požadavky;
- autentizace Store serveru vůči Account serveru a rotace klíčů;
- request schema, correlation ID a zákaz klientem dodaného user ID;
- response schema se stabilním interním user ID;
- význam e-mailu, samostatný `email_verified` příznak a okamžik ověření;
- role/oprávnění pouze pokud jsou autoritativní součástí kontraktu;
- `issued_at`, `expires_at`, maximální stáří identity a clock-skew;
- connect/read/total timeout a zákaz neomezených retry;
- odhlášení, revokace a invalidace Store-side cache;
- CSRF pravidla pro browserové změny a přesný CORS allowlist;
- povolené return URL a ochrana proti open redirect;
- podpis odpovědi nebo jiné kryptografické ověření integrity a audience;
- fail-closed chování při timeoutu, 4xx, 5xx a neplatném JSON;
- staging endpoint, testovací identity a scénáře revokace/expirace.

## Minimální očekávaná data

Názvy polí jsou zatím `TBD`; implementace je nesmí předstírat:

```text
authenticated: boolean
stable_user_id: non-empty opaque string
verified_email: nullable string
email_verified: boolean
roles: optional verified list
issued_at / expires_at: timestamps
issuer / audience: verified identifiers
```

Cookie, query parametr, formulářový e-mail ani klientské `user_id` nejsou
identita. Budoucí integrace musí vzniknout pouze jako nový adaptér
`VeVitAccountAuthContext`; Claims, Returns, Delivery, Attachments a Favorites
nesmí volat Account URL přímo.

## Samostatný navazující task

Po schválení kontraktu implementovat adaptér, negativní testy podpisu/expirace,
staging E2E a teprve poté zapnout account objednávky a favorites. Tento task
nesmí být spojen s produkčním nasazením zákaznické agendy bez nového review.
