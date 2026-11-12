# Migrace login/registrace vevit account → Clerk

## Kontext

Vevit account je teď čistě custom auth: bcrypt hesla v Supabase `users`, opaque session (`__Host-vvsession` → sha256 v tabulce `sessions`), TOTP 2FA, Turnstile, e-mail verifikace a ~35 API rout ve stylu `*.php` (`src/app/account/api/…`). Navíc account funguje jako **vlastní OIDC provider** (issuer `https://vevit.cz/account`, ES256+PKCE, device flow) pro VeVit-office (Rust). Cíl: **Clerk převezme celý auth životní cyklus** (login, registrace, forgot/reset, 2FA, e-mail verifikace, social OAuth) s prebuilt UI v dark theme; Supabase `users` zůstává jako profil/entitlement store; OIDC provider zůstává, jen se přepojí na Clerk session — **VeVit-office beze změn**. V Dashboardu je předvybraná aplikace `app_3H13w8rHQnlFwwZMXBa8VWSMKxH`. (Pozn.: graf v `claude-code-docs` pokrývá dokumentaci Claude Code, ne vevit — graphify pipeline proto spustím na vevit-web-app.)

## Architektura cílového stavu

- **Clerk** = identity + hesla + MFA + verifikace + social + session (`auth()` z `@clerk/nextjs`).
- **Supabase `users`** = profil, tier, role, avatar, language…; nový sloupec `clerk_user_id` (unique). `sub` v OIDC tokenech zůstává `users.id` → stabilní.
- **Session bridge**: `loadSessionFromCookies()` vrací dál `{ user, csrfToken }` → všech ~40 konzumentů (dashboard layout, `me.php`, store, edu, office) se nemusí měnit.
- Vlastní OIDC provider (`src/lib/office/*`) zůstává; mění se jen dep `session` v `runtime.ts`.

## Kroky

1. **Graphify graf** (explicitní přání uživatele): pipeline z graphify skillu na vevit-web-app — AST extrakce kódu (`src/`, `account/`, `tests/`), build + clustering → `graphify-out/graph.{json,html}` + `GRAPH_REPORT.md` pro navigaci během migrace. Corpus >500 souborů → zúžit na relevantní podstromy.

2. **Clerk init**: uživatel nejdřív spustí `npx -y clerk@latest auth login` ve svém terminálu (Dashboard aplikace neautentizuje CLI). Pak `npx -y clerk@latest init --app app_3H13w8rHQnlFwwZMXBa8VWSMKxH` z rootu — nainstaluje `@clerk/nextjs`, env klíče, middleware. Následně `clerk config patch`: sign-in `/account/login`, sign-up `/account/register`, identifikátory email + username (nickname), lokalizace cs. Ověřit `npx -y clerk@latest doctor`.

3. **Wiring**: `ClerkProvider` do root layoutu (uvnitř `<body>`); `src/proxy.ts` (Next 16 middleware) obalit `clerkMiddleware` se zachováním locale logiky a OIDC carve-outů (`/account/.well-known/`, `/account/oidc/` musí projít Clerk contextem, ale bez locale redirectu). Bez `cacheComponents` → Suspense povinnosti odpadají.

4. **Session bridge** — přepsat `src/lib/account-session.ts`: `await auth()` → `users` dle `clerk_user_id`; stejný návratový typ; CSRF = HMAC(VEVIT_APP_SECRET, `${clerkSessionId}|csrf`); zachovat `AccountBackendUnavailableError`→503 sémantiku. JIT provision users řádku při prvním requestu + lazy sync `email_verified_at` z Clerk (kvůli OIDC claimu).

5. **Stránky**: `src/app/account/{login,register}/page.tsx` → `<SignIn/>`/`<SignUp/>` s `appearance` (dark tokeny z `account/assets/styles.css`: `--bg #101010`, `--card #161616`, `--primary #10b981`) + `localization` (překlady z `src/components/account/auth/auth-i18n`); mascot z `account/images/`. Smazat `forgot-password/`, `reset-password/`, `verify-2fa/` (řeší Clerk). Původní `login-form`/`register-form` komponenty odstranit.

6. **API routy**: smazat `api/{login,register,forgot-password,reset-password}.php`, `api/2fa/*` (7), `captcha-config.php`, `nickname-availability.php`. Zachovat a přepojit: `me.php` (Clerk-backed, kontrakt `{authenticated, user, csrf_token}` pro legacy `session.js` v home/edu/store/tools), `logout.php` (revoke Clerk session + cleanup), `sessions-list/revoke.php` → adaptovat na Clerk sessions API, `onboarding.php`, všechny profile/billing/preferences routy (jen session-gate). Auditovat catch-all `api/[...path]` edge-proxy fallback — zbylé auth endpointy portovat nebo dropped.

7. **DB**: `supabase/sql/account/029_clerk_link.sql` — `ALTER TABLE users ADD COLUMN clerk_user_id text UNIQUE` (+ index). Tabulka `sessions` zůstává (nechá se uschnout).

8. **OIDC rebase**: `src/lib/office/runtime.ts` — dep `session` místo parsování `__Host-vvsession` použije Clerk `auth()` kontext rout; `authorize()` redirect na `/account/login` s předáním `return_to` přes Clerk redirect param. Upravit `tests/unit/office/*` a `tests/integration/office-harness.mjs` (injektovaný session stub — harness běží bez Clerk middleware). Axiomy: `sub`=users.id, ES256 klíče z env, device flow, consent, pairing API beze změny.

9. **Import uživatelů**: `scripts/clerk-import.mjs` — export `users` přes service key → přepis `$2y$`→`$2a$` → Clerk bulk import (password hasher bcrypt; schéma ověřit proti aktuálním Clerk migrací docs při implementaci) → zpětný match dle e-mailu → `UPDATE users SET clerk_user_id`. TOTP secrety nejsou přenositelné → dotčení uživatelé si MFA znovu založí; `oauth_identities` reportovat (link přes e-mail při prvním social loginu). Nejdřív proti dev instanci.

10. **Cleanup**: prune `src/lib/account-auth.ts` (login/register/session-create/TOTP/turnstile), smazat `src/lib/turnstile.ts` a `account-totp.ts` refs, drop nepoužívané `@supabase/ssr`, CSP Report-Only přidat Clerk domény (script/connect/frame-src), aktualizovat `DECISIONS.md`, `SUPABASE-CONSUMERS.md`, `.env.example`, `docs/office/OIDC-SPEC.md` nezměněn.

## Ověření

- `npx -y clerk@latest doctor`; `npm run dev` → registrace nového uživatele → JIT users řádek → `me.php` vrátí user → dashboard/onboarding → session slot v home/store.
- Login importovaného uživatele (bcrypt) funguje.
- OIDC: `npm run test:unit`; `tests/integration/office-harness.mjs` + `VeVit-office/tools/integration-vevit.sh` (cargo `online_vevit`) zelené; authorize → Clerk login → consent → code → ES256 ID token s `sub`=users.id.
- `npm run typecheck`; `npm run lint`.
- Produkční klíče/doména vevit.cz až později přes `clerk deploy` (vyžaduje claim aplikace uživatelem).

## Rollout

Nová větev `feat/clerk-auth`. Cutover: staré `__Host-vvsession` sessiony přestanou platit (jednorázové přihlášení přes Clerk). Produkce až po claimu aplikace a konfiguraci domény.

## Klíčové soubory

`package.json` · `src/app/layout.tsx` · `src/proxy.ts` · `src/lib/account-session.ts` (+ `account-session-destroy.ts`) · `src/app/account/{login,register}/page.tsx` · `src/app/account/api/**` · `src/lib/account-auth.ts` · `src/lib/office/runtime.ts` · `supabase/sql/account/029_clerk_link.sql` (nový) · `scripts/clerk-import.mjs` (nový) · `tests/integration/office-harness.mjs`