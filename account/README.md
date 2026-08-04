# VeVit — Nastavení účtu (WEDOS)

Statický frontend (HTML/CSS/vanilla JS) + PHP backend. Bez Node.js, bez buildu.
Nahraje se přímo na WEDOS web hosting přes FTP.

## Struktura

```
index.html              vstup — Clerk gate + celá účet stránka
assets/
  styles.css            design tokeny + komponenty
  config.js             PUBLIC klíče (Clerk publishable, Supabase URL+anon)
  app.js                Clerk auth + Supabase data + UI logika
api/
  config.sample.php     šablona secretů → zkopírovat na config.php na serveru
  _verify.php           ověření Clerk session JWT (RS256 vs JWKS)
  delete-account.php    smazání účtu (Clerk backend API + Supabase)
  export-data.php       GDPR export dat
sql/schema.sql          Supabase tabulky + RLS
.htaccess               HTTPS, ochrana secretů, Authorization header
```

## Kdo co dělá

- **Clerk** = identita: přihlášení, session/relace, heslo, 2FA, OAuth účty, mazání
- **Supabase** = app data: notif. preference, fakturační údaje, jazyk/měna, aktivita
- **PHP** = citlivé operace se secret klíči (mazání účtu, export)

---

## Nastavení — krok za krokem

### 1. Clerk (dashboard.clerk.com)
1. Vytvoř aplikaci → zkopíruj **Publishable key** a **Secret key**
2. **Domains** → přidej svoji WEDOS doménu (např. `ucet.vevit.cz`) do allowed origins
3. Povol metody: Email/heslo, Google/GitHub/Microsoft OAuth, TOTP (2FA)
4. Zkopíruj **Frontend API URL** (issuer, např. `https://xxx.clerk.accounts.dev`)

### 2. Supabase (supabase.com)
1. Vytvoř projekt → **Settings → API**: zkopíruj `URL`, `anon` key, `service_role` key
2. **Authentication → Third-party auth → Clerk**: zapni integraci (zadej Clerk domain)
   — díky tomu `auth.jwt()->>'sub'` = Clerk user id a RLS funguje
3. **SQL editor** → spusť obsah `sql/schema.sql`

### 3. Vyplň klíče
- `assets/config.js` → Clerk **publishable** key, Supabase URL + **anon** key (jsou public)
- Na WEDOSu zkopíruj `api/config.sample.php` → `api/config.php` a vyplň
  **secret** key, issuer, service_role, doménu. `config.php` se necommituje.

### 4. Nahraj na WEDOS
FTP celý obsah složky do web rootu. Ověř, že běží PHP (WEDOS: PHP 8.x, cURL + openssl zapnuté).

---

## Bezpečnost
- Secret klíče (Clerk secret, Supabase service_role) jsou **jen** v `api/config.php` na serveru — nikdy v JS.
- Každý PHP endpoint ověří Clerk JWT proti JWKS (`_verify.php`) než něco udělá.
- RLS v Supabase omezuje čtení/zápis jen na vlastní řádek uživatele.
- `.htaccess` blokuje přístup k `config.php`, `*.sql`, `*.md`.

## Poznámky / TODO
- **Billing** (platby, faktury) je zatím mock v UI. Reálně napojit přes platební bránu
  (GoPay / Comgate / Stripe) přes další PHP endpoint + webhook zapisující do Supabase.
- 2FA modal: `confirm2FA()` je potřeba doplnit o vstup 6místného kódu a
  `clerk.user.verifyTOTP({ code })`.
- Aktivita (`account_activity`) se plní ze serveru — přidej zápis při loginu
  (Clerk webhook → PHP → Supabase service role).

## Design reference
`Vevit Account.dc.html` je původní dc-runtime mockup (design zdroj), neslouží k nasazení.
Design tokeny: `uploads/vevit---vše-na-jednom-místě-DESIGN.md`.
