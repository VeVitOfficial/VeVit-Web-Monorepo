# 11 · Otevřené otázky a co chybí

Stav k 2026-10-24.

## Čeká na rozhodnutí nebo kontrolu vlastníka

| # | Co | Proč | Kde |
|---|---|---|---|
| 0 | **Spustit migraci 025** na produkční databázi | Bez ní nejdou ranky student / učitel, třídy ani ukládání úprav; spuštění na produkčních datech nebylo součástí práce | `supabase/sql/account/025_edu_classes_aifb.sql`, kapitola 12 |
| 1 | Odborná kontrola **teorie** (asi 8 300 slov) | Text je nový, ne z plánu; po kontrole `status` → `reviewed` | `generovano/teorie.md` |
| 2 | Odborná kontrola **online kurzu** (asi 7 900 slov, 24 lekcí) | Do schválení je na produkci skrytý | `generovano/online-kurz.md` |
| 3 | Schválení **pilotních cvičení** (7) | Každé má `reviewNotes` s body k potvrzení | `generovano/pilotni-cviceni.md` |
| 4 | **Certifikáty** (F9) | Kdo vydává, podle čeho, název „Certified …“, cena, účty učitelů | `../F9-CERTIFIKACE-NAVRH.md` |
| 5 | **Souhlas zákonných zástupců** ověřitelný serverem | Účty učitelů a třídy už existují (kapitola 12), souhlas se ale pořád potvrzuje jen v rozhraní | kapitola 06 |
| 6 | **Push a pull requesty** | Větve `feat/aifb-f1-obsah` … `feat/aifb-teorie` navazují na sebe, základ `feat/platebni-brana`; nic není pushnuté | – |
| 7 | **Klíč k AI modelu** na produkci | Bez klíče AI cvičení vrací jen uložené odpovědi | kapitola 08 |

## Chybí obsah

- DOCX plánu pro 1. a 2. stupeň a všechna PDF (sekce „Soubory ke stažení“ je zatím jen u SŠ).
- Texty pro žáky (`pupil`) v obsahu z plánu jsou všude `todo`; existují jen pilotní cvičení.
- Hodnoticí rubriky a klíče odpovědí ke cvičením z plánu (potřebné i pro certifikaci).

## Technické dluhy a nezměřené věci

- Test se čtečkou obrazovky (NVDA, VoiceOver) neproběhl.
- Výkon produkčního buildu (LCP, TBT) nezměřen.
- E2E proti produkčnímu `next start` naposledy před přidáním online kurzu; workflow `aifb-e2e.yml` na GitHubu zatím neběžel.
- `vevit-tailwind.css` se při buildu přegeneruje; změny je nutné commitovat, jinak v produkci chybí nové třídy Tailwindu.
- V konzoli celého Edu chyby `favicon.ico 404` a `me.php 401` (sdílená hlavička, ne AIFB).
- Popisky uvnitř ilustrací jsou na úzkém mobilu menší (SVG se zmenšuje s šířkou); čitelné, ale drobné.
- Zbytek starého kurzu: trasa `src/app/edu/ai-gramotnost/certificate.php` (starý certifikát) zůstala, odkazuje na `/edu/ai-gramotnost/kurz`, kde je teď nový kurz.

## Role a třídy: co zatím chybí

- Učitel nevidí průběh žáků (průběh je dál jen v prohlížeči žáka).
- Účty žáků pod 15 let: registrace VeVit nemá samostatný souhlas zákonného zástupce pro třídy.
- E2E netestuje zápisy do databáze (založení třídy, připojení kódem, uložení úpravy); ověřené jsou jednotkovými testy a testem migrace v PGlite, živě až po spuštění migrace.
- Úpravy admina nejsou v gitu; `npm run docs:aifb` a validace pracují s obsahem z repozitáře.
- Popisky v editoru JSON jsou technické klíče tam, kde nemají český překlad (`aifb.edit.key.*`).

## Záměrně neuděláno (vyžaduje výslovný pokyn)

- Zápis XP do účtu VeVit.
- Platby, produkční data.
- Vydávání certifikátů.
