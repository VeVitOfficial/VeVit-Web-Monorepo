# 12 · Role, třídy a úpravy obsahu

Stav k 2026-10-24. Kdo co v AI gramotnosti vidí, jak učitel odemyká lekce a jak admin upravuje obsah.

## Role

Role se odvozuje z ranků účtu VeVit (tabulky `ranks` / `user_ranks`, migrace 015 a **025**). Když má účet víc ranků, platí nejvyšší role v pořadí admin → učitel → student → veřejnost.

| Role | Odkud | Co vidí |
|---|---|---|
| **admin** | rank `admin` nebo `owner` (oprávnění `*`) | Vše jako dřív: všechny kategorie a lekce, průvodce a tisk, návrhy (i na produkci), online kurz. U stránek má odkaz **Upravit** a v rozcestníku **Úpravy obsahu**. Smí zakládat třídy jako učitel. |
| **učitel** | rank `teacher` (oprávnění `edu.aifb.teacher`) | Všechny kategorie a lekce, metodiku, průvodce a tisk, online kurz. **Moje třídy**: zakládání tříd a odemykání lekcí. Návrhy jen v náhledu jako dřív. |
| **student** | rank `student` (oprávnění `edu.aifb.student`) | Rozcestník jen s kategoriemi svých tříd a online kurzem. V levelech vidí všechny lekce, ale otevřít jde jen ty, které učitel odemkl; ostatní mají štítek „Zamčeno · Odemkne učitel“ a nejsou odkazem. Bez metodiky pro učitele, bez průvodce a tisku. |
| **veřejnost** | bez ranku, i nepřihlášený | Jen online kurz. `/edu/ai-gramotnost` i všechny adresy levelů přesměrují (307) rovnou na `/edu/ai-gramotnost/kurz`, bez rozcestníku („prostředního menu“). Dokud je kurz návrh, vidí zprávu „Online kurz se připravuje“ s odkazem pro žáky s kódem. |

Výpadek účtů nebo databáze znamená roli veřejnost: návštěvník vidí jen veřejný kurz, nikdy víc.

Kód: `src/lib/edu/aifb/access.ts` (čistá logika), `viewer.ts` (role pro požadavek), `gate.ts` (přesměrování).

### Přesměrování

| Stránka | veřejnost | student | učitel / admin |
|---|---|---|---|
| rozcestník `/edu/ai-gramotnost` | → kurz | jen jeho kategorie | vše |
| kategorie, level, lekce | → kurz | jen kategorie jeho tříd, jinak → rozcestník; zamčená lekce = stránka „Lekce je zatím zamčená“ | vše |
| průvodce pro učitele, tisk | → kurz | → rozcestník | vše |
| Moje třídy `/ucitel` | → kurz | → rozcestník | ano |
| Úpravy obsahu `/upravy` | → kurz | → rozcestník | jen admin (učitel → rozcestník) |
| online kurz | ano (návrh jen zpráva) | ano | ano (admin i návrh) |

AI endpoint (`/edu/api/aifb/complete`) obslouží jen lekci, kterou návštěvník smí otevřít.

## Třídy a kód

1. **Učitel** dostane rank `teacher` od admina v konzoli účtu (Konzole → Uživatelé → rank).
2. Na stránce **Moje třídy** (`/edu/ai-gramotnost/ucitel`, odkaz v rozcestníku) založí třídu: název (např. 6.A) a kategorii (1. stupeň / 2. stupeň / SŠ). Dostane kód, např. `ABCD-2345` (8 znaků bez 0/O a 1/I).
3. **Žák** s vlastním účtem VeVit klikne na hlavním webu na **VeVit Edu pro školy** (tlačítko v úvodu, položka v menu Edu, mobilní menu a patička) → `/edu/skoly#trida` → okno **Máš kód třídy?** → zadá kód. Nepřihlášený dostane odkaz na přihlášení s návratem zpět.
4. Připojením dostane rank `student` (zdroj `class`) a je zařazený do třídy v databázi.
5. Učitel na stránce třídy odemyká lekce: zaškrtávátko u každé lekce (teorie i cvičení), u bloku / levelu tlačítka **Odemknout vše** a **Zamknout vše**. Změna platí hned.

Na stránce třídy učitel dále vidí žáky (jen přezdívku a datum připojení), může žáka odebrat, třídu přejmenovat, vygenerovat nový kód (starý přestane platit, žáci zůstanou) nebo třídu zrušit.

Žák může třídu opustit na stránce pro školy. Když není v žádné třídě, rank `student` se mu odebere, ale jen pokud ho dostal připojením; rank přidělený ručně adminem zůstává.

Pokusy o kód jsou omezené na 10 za 10 minut na účet. Učitel smí spravovat jen svoje třídy, admin všechny.

Průběh žáka (hotové lekce, XP) zůstává v prohlížeči jako dřív; učitel ho nevidí.

## Úpravy obsahu (admin)

- **Kde:** odkaz **Upravit** u kategorie, levelu, lekce, teorie, pilotního cvičení a u přehledu, modulu a lekce online kurzu; nebo rozcestník → Správa → **Úpravy obsahu** (`/edu/ai-gramotnost/upravy`) s přehledem všech upravitelných částí a posledních úprav.
- **Co jde upravit:** kategorie (název, podtitul…), kapitoly průvodce, level (bez lekcí), lekce, téma teorie a sekce navíc pro level, stav a poznámka teorie, kurz (název, úvod, stav…), modul kurzu (včetně teorie modulu), lekce kurzu, pilotní cvičení.
- **Editor:** režim **Texty** (každé textové pole zvlášť, technická pole jako `id`, `type`, `order` jen ke čtení, u `status` výběr draft / reviewed / published, seznamy textů s Přidat / Odebrat) a režim **JSON (pokročilé)** pro změny struktury (nový krok, otázka, sekce).
- **Uložení:** server zkontroluje celý dokument stejnými pravidly jako validace při buildu (schéma, neměnná id, odkazy do průvodce, certifikace jen „planned“, teorie, kurz, cvičení, R1). Neplatnou úpravu odmítne se seznamem chyb.
- **Historie:** každé uložení je nový záznam (kdo, kdy, poznámka). **Obnovit tuto verzi** načte starší verzi do editoru, **Vrátit na původní text** zruší úpravu a platí text z repozitáře.
- **Schválení:** stav `draft` → `reviewed` u kurzu, teorie nebo pilotního cvičení zveřejní text na produkci (R7, schvaluje vlastník = admin).
- **Kde se ukládá:** tabulka `aifb_content_edits` v Supabase. JSON soubory v repozitáři se nemění (R6); úpravy se skládají přes ně. Na webu se projeví do ~10 s (mezipaměť instance).

Kód: `src/lib/edu/aifb/edits.ts` (cesty a skládání), `edit-validate.ts`, `edits-store.ts`, `src/app/edu/api/aifb/upravy/route.ts`, `src/components/edu/aifb/content-editor.tsx`.

Pozor: úpravy v databázi nejsou v gitu. `npm run docs:aifb`, validace a testy pracují s obsahem z repozitáře. Trvalou změnu je lepší přenést i do JSON souboru (kapitola 10).

## Databáze (migrace 025)

Soubor `supabase/sql/account/025_edu_classes_aifb.sql`. **Zatím není spuštěná na produkční databázi**; dokud ji nikdo nespustí, nikdo nemá rank student / učitel, třídy ani úpravy nejdou uložit a stránky se chovají podle rolí bez nich (admin dál vidí vše).

| Objekt | Účel |
|---|---|
| ranky `student`, `teacher` | druh `program`, oprávnění `edu.aifb.student` / `edu.aifb.teacher`, barvy převzaté z ranků učeň a tvůrce |
| `user_ranks.source` + `'class'` | rank student získaný kódem |
| `edu_classes` | třída: učitel, název, kategorie, unikátní kód, zrušení |
| `edu_class_members` | žák ve třídě (připojení, odebrání) |
| `edu_class_unlocks` | odemčené lekce třídy |
| `edu_join_class`, `edu_leave_class`, `edu_archive_class`, `edu_sync_student_rank` | připojení, opuštění, zrušení třídy a odebrání ranku bez třídy (atomicky v databázi) |
| `aifb_content_edits`, pohled `aifb_content_current` | historie úprav a platná úprava pro každou část |

Vše jen pro server (RLS bez politik, odebrané granty pro `anon` / `authenticated`). Migrace je idempotentní a byla vyzkoušená na Postgresu ve WASM (PGlite) včetně opakovaného spuštění.

## Testovací role

Pro vývoj a E2E jde roli nastavit cookie `aifb_test_role` (`admin`, `teacher`, `public`, `student` nebo `student:zs1:zs1-blok-a-teorie,zs1-blok-a-cv1`). Server ji čte jen v `next dev` nebo s `AIFB_TEST_ROLES=1` mimo Vercel (CI). Na produkci na Vercelu se nikdy nepoužije. Zápisové endpointy ji ignorují vždy a roli berou z přihlášeného účtu.
