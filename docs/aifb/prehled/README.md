# AI gramotnost (AIFB) – podrobný přehled

Tahle složka popisuje sekci **AI gramotnost** ve VeVit Edu: co obsahuje, jak funguje technicky, jaká pravidla platí a jak obsah upravovat. Stav k 2026-10-24, větev `feat/aifb-teorie`.

## Co tu najdeš

| Soubor | O čem je |
|---|---|
| [01-co-to-je.md](01-co-to-je.md) | Stručně: co sekce je, pro koho, z čeho se skládá, co uvidí návštěvník |
| [02-jak-to-funguje.md](02-jak-to-funguje.md) | Technika: trasy (URL), soubory, tok dat, komponenty, styly, jazyky |
| [03-obsah.md](03-obsah.md) | Obsah: kategorie, bloky a levely, teorie, lekce, průvodci pro učitele, počty |
| [04-teorie-a-ilustrace.md](04-teorie-a-ilustrace.md) | Jak je postavená teorie, typy bloků, ilustrace a animace |
| [05-online-kurz.md](05-online-kurz.md) | Online kurz pro všechny: moduly, lekce, cvičení, proč je takový |
| [06-cviceni-a-ai.md](06-cviceni-a-ai.md) | Interaktivní cvičení (kvíz, třídění, semafor) a cvičení s AI (endpoint, limity, ochrana údajů) |
| [07-prubeh-a-xp.md](07-prubeh-a-xp.md) | Místní průběh, XP, drahokamy, export a import |
| [08-pravidla-a-zverejneni.md](08-pravidla-a-zverejneni.md) | Pravidla R1–R9, stavy návrh / schváleno, co se ukazuje na produkci, proměnné prostředí |
| [09-testy-a-kontroly.md](09-testy-a-kontroly.md) | Validace obsahu, unit, smoke a E2E testy, CI |
| [10-jak-upravit-obsah.md](10-jak-upravit-obsah.md) | Návody: schválit text, upravit teorii, přidat lekci nebo ilustraci, soubor ke stažení |
| [11-otevrene-otazky.md](11-otevrene-otazky.md) | Co čeká na rozhodnutí vlastníka a co chybí |
| [12-role-tridy-a-upravy.md](12-role-tridy-a-upravy.md) | Ranky student a učitel, třídy s kódem, odemykání lekcí, úpravy obsahu adminem, migrace 025 |

### Vygenerované přehledy (složka `generovano/`)

Vznikají skriptem `npm run docs:aifb` přímo z obsahových souborů, takže odpovídají tomu, co web opravdu zobrazuje. Ručně je neupravuj, po změně obsahu skript spusť znovu.

| Soubor | Obsah |
|---|---|
| [generovano/lekce-aifb.md](generovano/lekce-aifb.md) | Všechny kategorie, bloky / levely a lekce s časy, výstupy a cíli |
| [generovano/teorie.md](generovano/teorie.md) | Celý text teorie všech 10 témat + tabulka ilustrací (k odborné kontrole) |
| [generovano/online-kurz.md](generovano/online-kurz.md) | Celý text online kurzu včetně správných odpovědí cvičení (k odborné kontrole) |
| [generovano/pilotni-cviceni.md](generovano/pilotni-cviceni.md) | Pilotní interaktivní cvičení pro žáky a poznámky k potvrzení |
| [generovano/struktura.json](generovano/struktura.json) | Strojově čitelná struktura: kategorie → levely → lekce, moduly kurzu, počty |

## Starší dokumenty ve `docs/aifb/`

- `RECON.md` – průzkum repozitáře před stavbou a deník rozhodnutí (§ 16–21 popisují pozdější přestavby).
- `QA.md` – kontrola kvality: přístupnost, výkon, testy, soukromí, otevřené problémy.
- `F9-CERTIFIKACE-NAVRH.md` – návrh certifikátů (neimplementováno, čeká na rozhodnutí).
- `screenshots/` – snímky obrazovky.

## Nejkratší shrnutí

- Adresa: `/<jazyk>/edu/ai-gramotnost` (např. `/cs/edu/ai-gramotnost`).
- Tři kategorie podle věku (1. stupeň ZŠ, 2. stupeň ZŠ, SŠ) s 16 bloky / levely. Každý má **teorii** a pod ní **lekce 1–5**.
- **Online kurz pro všechny**: 6 modulů, každý s teorií a 4 lekcemi. Zatím návrh, na produkci ho vidí jen admin.
- **Role:** veřejnost vidí jen online kurz, student jen lekce odemčené učitelem ve své třídě, učitel všechno a správu tříd, admin všechno a úpravy obsahu (kapitola 12).
- Obsah je v JSON souborech v `src/content/aifb/`; úpravy admina se ukládají do databáze a skládají se přes ně.
- Žádná analytika, průběh jen v prohlížeči.
