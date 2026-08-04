# AI Gramotnost – LMS (vanilla JS SPA + PHP + MySQL, NO-AUTH)

Kompletní e-learningový kurz AI gramotnosti. **Bez přihlašování** – přihlášení bude v budoucnu řešeno genericky přes vevit edu. Progress/XP/achievementy se ukládají v **localStorage** (per-prohlížeč). Obsah (kurzy/lekce/cvičení) je v MySQL.

## Struktura
```
index.html            SPA shell
.htaccess             security + CORS + SPA fallback
styles.css            design system (tmavý, zelený akcent #10B981)
config.js, utils.js, api-client.js, state.js, gamification.js, components.js, router.js, app.js
exercises/            8 interaktivních engineů
api/                  PHP JSON API (jen: config, courses, exercises) – bez auth/sessions
data/schema.sql       MySQL schéma (obsah + nepoužívané user tabulky)
data/content.php      data kurzu (buildery + 36 lekcí + cvičení + achievementy) – bez DB
data/seed.php         seeder: vloží obsah do DB (spusť jednorázově)
```

## Co se změnilo (no-auth)
- Žádné přihlašování/registrace/sessions/uživatelé – LMS je otevřené.
- API: pouze `courses.php` (obsah) a `exercises.php` (vyhodnocení cvičení, bez ukládání). `auth/progress/achievements/leaderboard/admin` endpointy byly odstraněny.
- Progress (dokončené lekce, XP, levely, streaky, achievementy) = **localStorage** v `gamification.js` (`LocalProgress`). Synchronizace se serverem přijde s budoucím vevit edu přihlášením.
- Admin panel a žebříček odstraněny (vyžadovaly uživatele).

## Nasazení na Wedos
1. V Wedos adminu vytvoř MySQL databázi.
2. Importuj `data/schema.sql` přes phpMyAdmin.
3. Vyplň DB údaje v `api/config.php` (`DB_HOST/DB_NAME/DB_USER/DB_PASS`).
4. Spusť seeder jednorázově: `php data/seed.php` (nebo navštív `/data/seed.php`).
5. Nahraj obsah této složky do `www/ai-gramotnost/` (nebo rootu subdomény).
6. Otevři web – rovnou kurz bez přihlášení.

## Z hlavního webu (vevit edu)
Karta „AI gramotnost" na hlavní stránce odkazuje na `ai-gramotnost/` (tuto aplikaci). V navbaru LMS je odkaz „← vevit.fun" zpět.

## Poznámky
- **Funguje i bez DB**: pokud MySQL není nastavená (nebo není oseedovaná), API automaticky obslouží obsah z `data/content.php` (všech 36 lekcí + 110 cvičení). S nastavenou DB se použije MySQL. Progress je vždy v localStorage.
- Obsah lekcí je stručný (lze rozšířit úpravou `data/content.php` a opětovným seedem).
