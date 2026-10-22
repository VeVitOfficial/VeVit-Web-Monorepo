# AIFB F9 – certifikáty a ověřování: návrh ke schválení

Stav: **návrh, nic není implementováno.** Plán (F9.1) výslovně říká, že před implementací musí existovat písemně schválený popis, co certifikát potvrzuje a co ne. Tento dokument je ten popis ve formě návrhu. Do schválení platí pravidlo R4: u všech levelů zůstává štítek „Připravuje se" a aplikace žádnou certifikaci neslibuje ani nevydává.

## 1. Proč se nezačalo kódovat

- Vydávání certifikátů vyžaduje trvalé záznamy (produkční databáze), osobní údaje (i nezletilých) a rozhodnutí provozovatele o podmínkách. To jsou věci, na které plán zakazuje sahat bez rozhodnutí vlastníka.
- AIFB nemá přihlášení ani účty učitelů. Nevíme tedy, kdo certifikát vydá a komu.
- Plány pro učitele neobsahují hodnoticí rubriky, klíč odpovědí ani kritéria úspěchu (plán, `knownGaps`). Bez nich nelze říct, na základě čeho se certifikát uděluje.

## 2. Návrh textu: co certifikát potvrzuje a co ne (ke schválení)

Potvrzuje:
- že osoba absolvovala příslušný level AIFB (např. „Level 1 – AIFB Foundation") podle metodiky VeVit ve verzi obsahu `2026-10`,
- datum vydání a vydávající školu nebo učitele.

Nepotvrzuje:
- žádnou státní ani oborovou kvalifikaci, akreditaci ani uznání jiným subjektem,
- úroveň dovedností mimo obsah levelu,
- identitu držitele (u osob mladších 18 let se celé jméno nikdy nezobrazuje).

Název „Certified …" (např. *Certified AI Associate*) je v obsahu označen jako plánovaný. Je třeba rozhodnout, zda je slovo „certified" přijatelné pro školní potvrzení o absolvování, nebo zda zvolit neutrální „Potvrzení o absolvování".

## 3. Návrh ověřovací stránky `vevit.cz/<jazyk>/edu/ai-gramotnost/overeni/[ID]`

- Zobrazí jen: stav (platný / zneplatněný / opravený), level, datum vydání, vydávající organizaci a verzi obsahu. Držitel: u zletilých volitelně zkrácené jméno, u nezletilých jen pseudonym nebo iniciály podle volby školy.
- ID je náhodné (např. 12 znaků bez zaměnitelných písmen), ne pořadové číslo. Neexistující ID i zneplatněné ID vrací stejně strukturovanou stránku bez prozrazení dalších informací.
- Stránka má `noindex`, žádnou analytiku a žádné cookies. Limit požadavků na IP. QR kód (v repozitáři je knihovna `qrcode`) vede na tuto adresu.
- Oprava a zneplatnění: záznam se nemaže, mění stav (`revoked`, `corrected`) s důvodem a datem; ověřovací stránka stav zobrazí.

## 4. Návrh datového modelu (po schválení)

Tabulka `aifb_certificates` (jen čtení pro veřejnou stránku, zápis jen server):
`id` (náhodné), `level_id`, `content_version`, `issued_at`, `issuer_org`, `holder_label` (pseudonym/iniciály/zkrácené jméno podle věku), `holder_is_minor`, `status` (`valid|revoked|corrected`), `status_reason`, `status_changed_at`, `signature` (HMAC nad poli, klíč jen na serveru).
Žádný e-mail, rodné číslo ani datum narození v záznamu.

## 5. Osobní údaje a nezletilí

- Právní základ a doba uchování určí provozovatel s pověřencem; zde jen požadavky: minimalizace údajů, u mladších 18 let žádné celé jméno, možnost opravy a výmazu (zneplatněním a anonymizací držitele), žádný přenos mimo EU bez rozhodnutí.
- Vydání certifikátu žákovi vyžaduje, aby škola potvrdila pravidla pro informování a souhlas zákonných zástupců (stejně jako u cvičení s AI, R5).
- Toto není právní porada; text je k posouzení pověřencem.

## 6. Otázky, na které potřebuji rozhodnutí

1. Kdo certifikát vydává (škola / učitel / VeVit) a kdo za něj ručí?
2. Na základě čeho se uděluje (docházka, splněná cvičení, test)? Pokud test, kdo dodá zadání, klíč a rubriky?
3. Smí se používat název „Certified …", nebo neutrální označení?
4. Placený, nebo bezplatný certifikát? Platnost (trvale / časově omezeně)?
5. Vyžaduje se přihlášení učitele (účet VeVit, školní licence)? Bez něj nelze vydávání omezit na oprávněné osoby.
6. Schvaluje text pro držitele a veřejnou stránku vlastník, nebo i spolupracující učitel?

## 7. Navržený postup po schválení

| Krok | Obsah |
|---|---|
| F9.0 | Písemné schválení bodů 2, 3, 5 a odpovědi na body 6 |
| F9.1 | Veřejná ověřovací stránka jen pro čtení nad tabulkou (testy, `noindex`, limity) |
| F9.2 | Vydávání (vyžaduje účty učitelů / školní licenci a schválená kritéria) |

Do schválení se v aplikaci nic nemění: levely 1–3 ukazují „Plánovaná certifikace …: Připravuje se", levely 4–6 „Certifikace: Připravuje se".
