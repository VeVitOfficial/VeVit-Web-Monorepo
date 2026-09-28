# VeVit Monorepo — Migration Report
**Datum:** 2026-08-02

## Výsledná struktura

```
vevit-monorepo/
├── home/          ← VeVit-portal  (vevit.cz/home/)
├── account/       ← VeVit-account (vevit.cz/account/)
├── edu/           ← VeVit-edu     (vevit.cz/edu/)
├── store/         ← VeVit-store   (vevit.cz/store/)
├── tools/         ← VeVit_tools   (vevit.cz/tools/)
├── nginx-vevit.conf
├── sitemap.xml
└── robots.txt
```

> Poznámka k portálu: původně plánováno na root (`/`), na tvůj požadavek přesunuto do `home/`.
> Nginx přesměrovává `vevit.cz/` → `vevit.cz/home/` (viz nginx-vevit.conf).

## Co bylo přesunuto (kopie, originály nedotčeny)

| Původní složka    | Cílová cesta       |
|-------------------|--------------------|
| VeVit-portal      | vevit-monorepo/home/ |
| VeVit-account     | vevit-monorepo/account/ |
| VeVit-edu         | vevit-monorepo/edu/ |
| VeVit-store       | vevit-monorepo/store/ |
| VeVit_tools       | vevit-monorepo/tools/ |

Vyloučeno z kopie: `.git`, `.claude`, `.playwright-mcp`, `.superpowers`, `.idea`, `.worktrees`, `graphify-out`, `.impeccable`.

---

## Co bylo přepsáno automaticky

### Portal (`home/`)
- `index.html`, `support.html`: všechny `https://tools/edu/account/store.vevit.cz/...` → `/tools/`, `/edu/`, `/account/`, `/store/` (href + display text)
- `assets/js/account-session.js`: `ACCOUNT_ORIGIN` → `''`, account linky → `/account/...`
- `assets/js/app.js`, `support.js`: subdomain URL → relativní cesty
- `api/login.php`, `api/register.php`, `api/config.php`: redirect URL → `/account/...`

### Tools (`tools/`)
- `includes/header.php`, `includes/footer.php`, `index.html`, `tools.php`: absolutní `/assets/...` → `/tools/assets/...`, `/images/...` → `/tools/images/...`, `href="/"` → `href="/tools/"`, `href="/#..."` → `href="/tools/#..."`
- `includes/header.php`: login link → `/account/login`
- `.htaccess`: rewrite rule `^tools/([slug])` → `^([slug])` (v subdirectory .htaccess Apache odstraní prefix)

### EDU (`edu/`)
- `js/router.js`: přidán `BASE_PATH = '/edu'`, funkce `stripBase()`, redirect `/` → `/edu/dashboard/`, 404 link → `/edu/dashboard/`
- `.htaccess`: SPA fallback `/index.html` → `/edu/index.html`
- `index.html`: canonical + og:url `https://edu.vevit.cz` → `https://vevit.cz/edu`

### Store (`store/`)
- `index.html`: `meUrl`, `loginUrl` → `https://vevit.cz/account/...`, og:image path opravena
- `config.example.php`, `lib/config.php`, `lib/auth.php`, `lib/VevitAccount.php`, `lib/header.php`: default URL konstanty → `https://vevit.cz/account/...`
- `assets/js/vevit-account.js`: account URL konstanty + `appOrigin` → `https://vevit.cz`

### Account (`account/`)
- `config.php`: `ALLOWED_ORIGIN`, `COOKIE_DOMAIN`, `APP_URL`, `APP_BASE_URL` → `vevit.cz/account`
- `.htaccess`: odstraněn HTTPS redirect (řeší Nginx), opraveno routing pravidlo `^/?account(/.*)?$` → `^(/.*)?$`
- `index.html`, `login.html`, `register.html`, `forgot-password.html`, `reset-password.html`: `https://account.vevit.cz` → `https://vevit.cz/account`, asset cesty `/assets/` → `/account/assets/`

### Nové soubory
- `nginx-vevit.conf`: hlavní server + 301 redirecty z starých subdomén
- `sitemap.xml`: unified sitemap pro všechny sekce
- `robots.txt`: blokuje admin/api/interní složky, odkazuje na sitemap
- `.htaccess` (root): HTTPS redirect, www→non-www, bezpečnostní blokování

---

## Co je potřeba zkontrolovat ručně (API volání / backend)

### 🔴 KRITICKÉ — Auth cookies cross-domain

**Problém:** VeVit Account původně používal `vevit_session` cookie vázanou na `account.vevit.cz`. Tato cookie je host-only a `store.php` ji nikdy neobdržel — záměrně. Po přesunu na `vevit.cz/account/` a `vevit.cz/store/` jsou obě aplikace na stejné doméně.

**Co je potřeba udělat:**
- `account/config.php`: `COOKIE_DOMAIN` změnit z `account.vevit.cz` na `.vevit.cz` nebo `vevit.cz` (tečka na začátku = cookie sdílená s subdoménami, bez tečky = jen `vevit.cz`)
- Ověřit, že store může číst/validovat `vevit_session` cookie od account (nebo zda stále volá account endpoint přes HTTP)
- CORS konfigurace v account: `ALLOWED_ORIGIN` → `https://vevit.cz` (aktualizováno, ale ověřit)

### 🔴 Store → Account API volání (server-side)
- `store/lib/VevitAccount.php` volá `https://vevit.cz/account/api/me.php` — server-side HTTP request
- Po sloučení na stejnou doménu toto může stále fungovat přes HTTP, ale výkonnější by bylo include PHP souboru přímo (sdílená DB session)
- Soubor: `store/lib/VevitAccount.php:114`

### 🟡 Account: OAuth redirect URIs
- Pokud account používá OAuth (Google, GitHub...), redirect URI `https://account.vevit.cz/callback` musí být aktualizováno na `https://vevit.cz/account/callback` v OAuth konzolích (Google Cloud Console, GitHub Apps, atd.)
- Zkontrolovat: `account/config.php`, `account/api/`

### 🟡 Stripe webhooks (Store)
- `store/api/webhook.php` přijímá Stripe eventy
- URL webhook endpoint v Stripe Dashboardu změnit z `https://store.vevit.cz/api/webhook.php` na `https://vevit.cz/store/api/webhook.php`

### 🟡 EDU SPA — interní linky v komponentách
- `js/router.js` byl aktualizován s BASE_PATH, ale komponenty (`navbar.js`, `home.js`, `course.js`, atd.) mohou mít hardcoded `href="/dashboard/"` linky
- Tyto jsou zachyceny `onClick` interceptorem a automaticky doplněny `/edu` prefixem
- Pokud komponenty používají `history.pushState` přímo místo `navigate()`, potřebují ruční kontrolu

### 🟡 Tools — PHP session / zpracování dat na serveru
- `tools/api/ai/ollama.php` a `tools/api/ssl-check.php`, `tools/api/feedback.php` — ověřit, že CORS hlavičky (pokud jsou nastaveny) odkazují na `https://vevit.cz` místo `https://tools.vevit.cz`

### 🟡 Store: APP_URL v config.php
- `store/config.php` (produkční config, není v repozitáři) musí mít `APP_URL=https://vevit.cz/store`
- `store/config.example.php` byl aktualizován

### 🟡 Analytics / Tracking kódy
- Zkontrolovat, zda Google Analytics, Hotjar, nebo jiné tracking skripty mají filtry podle domény/cesty nastaveny na staré subdomény
- Pravděpodobná místa: `home/index.html`, `store/lib/header.php`, `tools/index.html`

### 🟡 EDU: PHP AI proxy
- `edu/php/ai-proxy.php` — zkontrolovat CORS hlavičky a allowed origins

### 🟡 Store: stránka pro download souborů
- `store/download.php` generuje tokeny — ověřit, že callback URL zahrnuje `/store/` prefix

---

## Testovací checklist (lokálně)

```bash
# PHP dev server pro monorepo root
cd /home/vitekeee/Projects/vevit-monorepo
php -S localhost:8080

# Nebo Nginx (nginx -c ./nginx-vevit.conf)
```

- [ ] `localhost:8080/home/` — portal landing page (CSS, JS, obrázky)
- [ ] `localhost:8080/home/support.html` — support stránka
- [ ] `localhost:8080/account/login` — login form (PHP)
- [ ] `localhost:8080/edu/` — přesměruje na `/edu/dashboard/`
- [ ] `localhost:8080/edu/programovani/` — SPA route
- [ ] `localhost:8080/store/` — store landing
- [ ] `localhost:8080/store/catalog.php` — katalog
- [ ] `localhost:8080/tools/` — tools landing
- [ ] `localhost:8080/tools/bg-remover` — tool detail (PHP route)
- [ ] Browser console — žádné 404 pro CSS/JS/obrázky
- [ ] Klikání na navigaci — žádné broken linky

---

## Nginx redirecty starých subdomén

Po nasazení Nginx konfigurace budou staré URL přesměrovány:

| Stará URL | Nová URL |
|-----------|----------|
| `https://account.vevit.cz/*` | `https://vevit.cz/account/*` |
| `https://edu.vevit.cz/*` | `https://vevit.cz/edu/*` |
| `https://store.vevit.cz/*` | `https://vevit.cz/store/*` |
| `https://tools.vevit.cz/*` | `https://vevit.cz/tools/*` |
| `https://vevit.cz/` | `https://vevit.cz/home/` |
