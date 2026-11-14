# Passkey, ověření e-mailu a nová políčka pro kód – design

Datum: 2026-11-14 · Stav: ke schválení

## Záměr

Zpevnit přihlášení a registraci účtů VeVit a zlepšit zadávání kódů:

1. Nová komponenta pro zadání 6místného kódu (6 samostatných políček s animací výsledku).
2. Povinné ověření e-mailu kódem při registraci.
3. Passkey (WebAuthn) jako samostatné přihlášení i jako druhý faktor místo TOTP.
4. Štítek „Naposledy použito" u přihlašovacích metod.

Pořadí implementace: 1 → 2 → 3 → 4. Každá část je samostatně nasaditelná.

## Současný stav (v kódu)

- Účty: Supabase tabulka `users`, vlastní session (`sessions`, cookie `__Host-vvsession`), `createSession` / `setSessionCookie` / `completeTotpSession` v `src/lib/account-auth.ts`.
- Přihlášení heslem: `src/app/account/api/login.php/route.ts`. Při aktivním TOTP vytvoří challenge (`auth_challenges`, kind `login_totp`) a vrátí `requires_2fa` + redirect na `verify-2fa`.
- 2FA ověření: `src/app/account/api/2fa/login-verify.php`, `recovery-verify.php`; UI `src/components/account/auth/verify-2fa-form.tsx` (jedno textové pole, přepínač TOTP ↔ recovery kód).
- Registrace: `src/app/account/api/register.php/route.ts` vloží uživatele a hned vytvoří session. E-mail se neověřuje.
- OAuth: `src/app/account/api/oauth/[provider]/callback.php`; nové účty vznikají s e-mailem ověřeným poskytovatelem (už dnes se odmítne `oauth_email_unverified`).
- E-maily: Resend přes HTTP API (`RESEND_API_KEY`), vzor v `forgot-password.php/route.ts`.
- UI přihlášení: `login-form.tsx`, `register-form.tsx`, `oauth-buttons.tsx`. Texty přes `accountT` / `account-auth-i18n.ts`.
- Anti-bot: honeypot + timing, `checkRateLimit`, `recordAttempt`, Turnstile.
- Existuje samostatné ověření e-mailu pro Office (`src/lib/office/email-verify.ts`, SQL 027) – nesouvisí, jen jako reference.

## Cíle

- Uživatel bez ověřeného e-mailu se nemůže přihlásit žádným způsobem.
- Passkey funguje jako přihlášení bez hesla i jako 2FA; správa v sekci Zabezpečení.
- Jedna sdílená komponenta kódu pro ověření e-mailu i TOTP.
- Zachovat stávající bezpečnostní vlastnosti (rate limit, anti-bot, jednorázové challenge, žádný únik existence účtu).

## Ne-cíle

- Ne SMS ani telefonní ověření.
- Ne rozšiřování o další OAuth poskytovatele.
- Ne změna Office e-mail verifikace ani Office OIDC.
- Ne nahrazení hesla (heslo zůstává).
- Žádný redesign login/register stránek mimo nutné prvky.

## Anti-cíle

- Nedovolit obejití ověření e-mailu přes OAuth nebo passkey.
- Nezamknout stávající uživatele.
- Neprozradit přes odpovědi, zda e-mail existuje.

## 1. Komponenta `OtpInput` (6 políček)

Sdílená klientská komponenta v `src/components/account/auth/`.

Chování:
- 6 samostatných čtverečků pro číslice. Zadání číslice přeskočí na další, Backspace na předchozí (při prázdném políčku), šipky přesouvají fokus.
- Vložení (paste) celého kódu rozdělí číslice do políček (ignoruje nečíselné znaky).
- `autocomplete="one-time-code"` pro autofill SMS/e-mailu na mobilu, `inputMode="numeric"`.
- Po zadání 6. číslice se kód odešle automaticky (komponenta zavolá `onComplete(code)`, rodič vrátí příslib výsledku).
- Přístupnost: skupina s popiskem, každé políčko má `aria-label` („Číslice 1 z 6"), výsledek oznámen přes `aria-live`.

Animace výsledku:
1. Při odesílání se čtverečky zatočí po kruhu kolem středu.
2. Poté splynou do středu.
3. Ve středu se objeví ✓ (úspěch) nebo ✕ (chyba).
4. Moje volba: po ✕ se chyba zatřese a komponenta se vrátí na prázdná políčka s fokusem na prvním. Po ✓ rodič provede redirect.
- Moje volba: čisté CSS/SVG animace (bez knihovny). `prefers-reduced-motion` → bez rotace, jen plynulé zobrazení ✓/✕.

Použití:
- `verify-2fa-form.tsx` (TOTP): nahradí textové pole. Recovery kód zůstává obyčejné textové pole (14 znaků, písmena + číslice) a tlačítko `Odeslat`.
- Nová stránka ověření e-mailu (část 2).

## 2. Ověření e-mailu při registraci

Data:
- `users.email_verified_at timestamptz null`.
- Moje volba: nová tabulka `email_verifications` (nebo `auth_challenges` s novým kind `email_verify`, podle toho, co je méně invazivní) – uložen hash kódu (ne kód), `user_id`, `expires_at`, počet pokusů, čas posledního odeslání.
- Migrace: nové SQL `supabase/sql/account/030_*.sql`; stávající uživatelé se označí `email_verified_at = created_at` (moje volba, aby se nikdo nezamkl).

Tok:
1. `register.php`: vloží uživatele, vygeneruje 6místný kód, pošle e-mail přes Resend, **nevytvoří session**. Odpověď nese identifikátor challenge a redirect na stránku ověření (např. `/account/verify-email?challenge=…`).
2. Stránka ověření: komponenta `OtpInput`, tlačítko „Poslat znovu" (s odpočtem), možnost vrátit se na registraci.
3. Nový endpoint `verify-email.php`: ověří kód (konstantní porovnání hashe), nastaví `email_verified_at`, vytvoří session, nastaví cookie a vrátí redirect. Stejný vzor jako `completeTotpSession`.
4. Nový endpoint `resend-verification.php`.
- Moje volba: kód platí 10 minut, max 5 pokusů na kód (pak nutné poslat nový), znovu poslat nejdříve po 60 s, rate limit na IP a na účet.

Blokace přihlášení:
- `login.php`: pokud `email_verified_at` je null → bez session; vrátí odpověď vedoucí na obrazovku ověření a pošle nový kód (po heslu správném). Moje volba: odpověď je až po správném hesle, aby se neprozradila existence účtu.
- Passkey login a OAuth se řídí stejným pravidlem. OAuth účty vznikají s ověřeným e-mailem → `email_verified_at` se nastaví při vytvoření.
- Existující `/account/api/me.php` a `src/lib/account-session.ts`: moje volba – nedotýkat se; blokace je při vzniku session, ne při jejím čtení.
- E-mailová šablona v češtině + ostatních jazycích projektu (i18n přes existující slovníky).

## 3. Passkey (WebAuthn)

Knihovny (moje volba): `@simplewebauthn/server` a `@simplewebauthn/browser`.

Data:
- Tabulka `user_passkeys`: `id`, `user_id`, `credential_id` (unique), `public_key`, `counter`, `transports`, `name`, `created_at`, `last_used_at`.
- Challenge se ukládají do `auth_challenges` (kind `passkey_register`, `passkey_login`, `passkey_2fa`), jednorázové, krátká platnost.
- RP ID a origin z konfigurace prostředí (`vevit.cz`; lokální vývoj `localhost`).

Funkce:
- **Registrace passkey** v Zabezpečení: přidat (po zadání hesla/aktivní session), pojmenovat, smazat. Moje volba: povolit více passkey na účet.
- **Přihlášení passkey** (bez hesla): tlačítko na `login-form.tsx`. Moje volba: discoverable credentials (uživatel nemusí zadat identifikátor). Po úspěchu vznikne session. Passkey se považuje za plnohodnotný faktor – 2FA se po něm už nepožaduje.
- **Passkey jako 2FA**: pokud má uživatel passkey, `verify-2fa` nabídne „Použít passkey" vedle TOTP; úspěšné ověření dokončí přihlášení stejně jako `completeTotpSession`.
- Moje volba: 2FA je „aktivní", když má uživatel TOTP **nebo** passkey; stav se zobrazí v Zabezpečení. Recovery kódy zůstávají pro TOTP.
- Ověření: rate limit, kontrola `counter`, aktualizace `last_used_at`, ověření `email_verified_at` před vytvořením session.

## 4. „Naposledy použito"

- Po úspěšném přihlášení se do `localStorage` uloží metoda (`password`, `passkey`, `google`, `…` dle `oauth-buttons.tsx`).
- Na přihlašovací stránce se u dané metody zobrazí štítek „Naposledy použito" (lokalizovaný).
- Moje volba: u OAuth se metoda uloží před přesměrováním k poskytovateli a potvrdí až po návratu přihlášeného uživatele. Je to jen kosmetika, nic bezpečnostního; chyba čtení `localStorage` nesmí rozbít stránku (try/catch).

## Omezení

- Next.js v tomto repu má breaking changes → před psaním kódu přečíst příslušné příručky v `node_modules/next/dist/docs/` (viz `AGENTS.md`).
- i18n: všechny nové texty do `account-auth-i18n.ts` / `account-i18n-dict.ts` pro všechny podporované jazyky; URL s prefixem locale.
- Tailwind se buildí do `src/styles/vevit-tailwind.css`; nové styly musí projít `npm run build:tailwind`.
- Testy: unit testy v `tests/unit/*.test.mjs` pro logiku kódu (generování, hash, expirace, pokusy); e2e/manuální ověření toku v prohlížeči.
- Bezpečnost: kódy ukládat jen jako hash, porovnávat v konstantním čase, jednorázové, expirace; žádná citlivá data v logu.

## Co je ponecháno na builderovi

- Přesná struktura tabulek a názvy sloupců, způsob uložení challenge (nová tabulka vs. `auth_challenges`).
- Podrobné časování a vzhled animace (délky, easing, rozměry čtverečků) v rámci popisu výše.
- Texty e-mailu a jeho vzhled v souladu s existujícím e-mailem pro obnovu hesla.
- Vzhled správy passkey v Zabezpečení v souladu se stávajícími sekcemi.

## Rozhodnutí z kontroly (moje volby, ke kontrole)

- **Nedokončená registrace:** neověřený účet se nesmí hromadit. Opakovaná registrace se stejným e-mailem na neověřený řádek jej přepíše (nové heslo, přezdívka, jméno) a pošle nový kód; odpověď je stejná jako u nové registrace. Neověřené řádky starší než 24 h se mažou (cron nebo úklid při registraci). Ověřený e-mail dál vrací stávající chybu „E-mail je již registrován".
- **OAuth a propojení:** callback dnes účty podle e-mailu nepropojuje (`account_already_exists`). Zachovat. Výjimka: pokud existující řádek je neověřený, OAuth ho smaže a vytvoří nový účet s ověřeným e-mailem (zabrání obsazení cizího e-mailu hesla útočníka).
- **Přihlášení neověřeného uživatele:** nový kód se pošle nejvýše jednou za 60 s (stejný limit jako „Poslat znovu"); jinak jen redirect na obrazovku ověření.
- **Challenge v URL:** je jen vyhledávací klíč. Tajemství je 6místný kód z e-mailu. Stejný precedens jako `login_totp`, bez další vazby na prohlížeč.
- **RP ID:** `vevit.cz` (funguje pro `www.vevit.cz` i apex). Origin z `NEXT_PUBLIC_SITE_URL`. Preview nasazení passkey nepodporují, lokálně `localhost`.
- **`auth_challenges`:** schéma tabulky není v repu v `schema.sql`; builder ověří v živé DB, zda `kind` je text, enum nebo CHECK, a podle toho přidá nové druhy nebo samostatnou tabulku.
