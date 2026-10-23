<!-- Vygenerováno skriptem scripts/aifb-docs.mjs (npm run docs:aifb). Needitovat ručně. -->

# Pilotní interaktivní cvičení (žákovská vrstva)

Soubor: `src/content/aifb/pupil-pilots.json`. Pilotní žákovská vrstva F6. Vše ve stavu draft (pravidlo R7): texty, karty a kvíz čeká na přečtení vlastníkem. Originální obsahové soubory aifb-content-*.json se nemění; tento soubor je přidává.

## `zs1-blok-a-teorie` · QuizCard · stav draft

Zkus si, co už víš. Vyber odpověď a přečti si vysvětlení.

**Cvičení na stránce: QuizCard**

1. Co udělá hlasová asistentka v telefonu, když se jí zeptáš, jaké bude počasí?
   - ▫️ Podívá se z okna.
   - ✅ Najde odpověď podle programu, který pro ni napsali lidé.
   - ▫️ Zeptá se kamaráda.
   - *Vysvětlení:* Hlasová asistentka je program. Lidé ho vymysleli a naučili.

2. Je počítač živý?
   - ▫️ Ano, má city.
   - ✅ Ne, je to stroj.
   - ▫️ Jen když je zapnutý.
   - *Vysvětlení:* Počítač je stroj. Nic ho nebolí, nechce spát a nemá rád. Dělá jen to, co ho lidé naučili.

3. Kdo vymyslel hru, kterou hraješ na tabletu?
   - ▫️ Tablet sám.
   - ✅ Lidé, kteří ji naprogramovali.
   - ▫️ Nikdo, objevila se sama.
   - *Vysvětlení:* Každou hru vymysleli a napsali lidé.

4. Když se počítač splete, kdo to může poznat a opravit?
   - ✅ Člověk.
   - ▫️ Nikdo, počítač se nikdy nemýlí.
   - ▫️ Jen jiný počítač.
   - *Vysvětlení:* Počítač se může splést. Proto se ptáme, ověřujeme a poradí nám člověk.

5. Co patří jen rodině a škole?
   - ✅ Jméno, adresa a fotografie.
   - ▫️ Oblíbená barva.
   - ▫️ Oblíbená hra.
   - *Vysvětlení:* Jméno, adresa a fotografie jsou tajemství. Neříkáme je cizím lidem ani počítačům.

**K potvrzení vlastníkem**

- Návrh kvízu z opakovacích otázek (F6.3). Možnosti, správné odpovědi a vysvětlení jsem navrhl já; plán klíč odpovědí neobsahuje. Schválit vzor, teprve poté se rozšiřuje na další lekce.

## `zs1-blok-a-cv1` · CardSort · stav draft

Roztřiď karty do tří hromádek. U karty, o které si nejsi jistý, řekni, proč jsi ji dal právě tam.

**Cvičení na stránce: CardSort**

*Nápověda:* Důležitější než správné zařazení je, jak to zdůvodníš.

- Hlasová asistentka → **nehodnotí se**
- Myčka nádobí → **nehodnotí se**
- Tablet s nabídkou videí → **nehodnotí se**
- Semafor na přechodu → **nehodnotí se**
- Pes → **nehodnotí se**
- Učitelka → **nehodnotí se**
- Fotoaparát, který najde tváře → **nehodnotí se**
- Samoobslužná pokladna → **nehodnotí se**

**K potvrzení vlastníkem**

- Karty a hromádky jsou z textu plánu. Plán výslovně říká, že u sporných karet (např. pokladna) je důležité zdůvodnění, proto komponenta nehodnotí správně/špatně (žádné expected).

## `zs1-blok-a-cv4` · TrafficLightCards · stav draft

Přečti si situaci. Zelená znamená, že to prozradit můžeš. Červená znamená tajemství.

**Cvičení na stránce: TrafficLightCards**

Tlačítka: zelená „Zelená: můžu říct“, červená „Červená: tajemství“.

- Kamarád na internetu se ptá, kde bydlíš. → **Červená: tajemství** (Tajemství. Řekni to rodičům nebo učiteli.)
- Aplikace chce vědět, jak se jmenuje tvoje maminka. → **Červená: tajemství** (Tajemství. Jména rodiny patří jen rodině. Zeptej se rodičů nebo učitele.)
- Nová hra chce tvoje telefonní číslo. → **Červená: tajemství** (Tajemství. Telefonní číslo patří jen rodině a škole.)
- Oblíbená barva. → **Zelená: můžu říct** (To můžeš říct. Oblíbená barva není tajemství.)
- Jméno tvé kočky. → **Zelená: můžu říct** (To můžeš říct. Jméno zvířátka není tajemství.)
- Adresa školy. → **Červená: tajemství** (Adresa je tajemství. Řekni to učiteli.)
- Fotka z narozeninové oslavy. → **Červená: tajemství** (Fotky jsou tajemství. Nikomu cizímu je neposílej.)

**K potvrzení vlastníkem**

- Situace jsou z textu plánu. Zařazení (zelená/červená) jsem odvodil z pravidla „jméno, adresa a fotografie patří jen rodině a škole“. Hraniční: jméno kočky (zelená) a adresa školy (červená); potvrdit.

## `zs2-level-2-cv1` · AiSandbox · stav draft

Dostaneš pět nepřesných zadání. Každé přepiš tak, aby v něm byla role pro model, kontext, přesný úkol a popis výstupu (rozsah, struktura, tón).

Obě verze si vyzkoušej, porovnej odpovědi a do poznámky napiš, co se změnilo.

**Cvičení na stránce: AiSandbox**

```json
{
  "mode": "prompt-rescue",
  "vaguePrompts": [
    "napiš něco o ekologii",
    "udělej mi přehled knihy",
    "pomoz mi s úkolem",
    "řekni mi něco o zvířatech",
    "napiš příběh"
  ]
}
```

**K potvrzení vlastníkem**

- Teacher text uvádí jen dvě vágní zadání (ekologie, přehled knihy). Zbylá tři (pomoz mi s úkolem, zvířata, příběh) jsem doplnil já; potvrdit nebo nahradit.
- Stavba cvičení vychází z textu plánu (5 zadání, 3 sloupce tabulky). Prototyp aifb-cviceni-detektiv-halucinaci.html řeší příbuzný postup (5 stavebních kamenů, zpětná vazba trenéra); zde je z něj převzata kontrola osobních údajů a omezení délky odpovědi, ne celý průběh.
- Živý model jen přes server (kontrola osobních údajů, limit, žádné ukládání). Bez nastavené služby se zobrazuje uložená ukázková odpověď.

## `ss-level-2-cv1` · AiSandbox · stav draft

Dostaneš pět nepřesných zadání. Každé přepiš tak, aby v něm byla role pro model, kontext, přesný úkol a popis výstupu (rozsah, struktura, tón).

Obě verze si vyzkoušej, porovnej odpovědi a do poznámky napiš, co se změnilo.

**Cvičení na stránce: AiSandbox**

```json
{
  "mode": "prompt-rescue",
  "vaguePrompts": [
    "napiš něco o ekologii",
    "udělej mi přehled knihy",
    "pomoz mi s úkolem",
    "řekni mi něco o zvířatech",
    "napiš příběh"
  ]
}
```

**K potvrzení vlastníkem**

- Teacher text uvádí jen dvě vágní zadání (ekologie, přehled knihy). Zbylá tři (pomoz mi s úkolem, zvířata, příběh) jsem doplnil já; potvrdit nebo nahradit.
- Stavba cvičení vychází z textu plánu (5 zadání, 3 sloupce tabulky). Prototyp aifb-cviceni-detektiv-halucinaci.html řeší příbuzný postup (5 stavebních kamenů, zpětná vazba trenéra); zde je z něj převzata kontrola osobních údajů a omezení délky odpovědi, ne celý průběh.
- Živý model jen přes server (kontrola osobních údajů, limit, žádné ukládání). Bez nastavené služby se zobrazuje uložená ukázková odpověď.

## `zs2-level-1-cv2` · AiSandbox · stav draft

Model napíše krátký text. Najdi věty, kterým nevěříš, a ke každé napiš, jak bys ověřil(a), jestli je pravdivá.

**Cvičení na stránce: AiSandbox**

```json
{
  "mode": "fact-check",
  "topicLabel": "Karel IV."
}
```

**K potvrzení vlastníkem**

- Plán říká, že sadu výstupů s chybami připraví učitel. Aplikace proto neobsahuje sadu chyb; nabízí jen jedno téma (Karel IV.) s uloženou ukázkou, do které jsem záměrně vložil dvě nepřesnosti (rok 1857 místo 1357 a vymyšlená kronika). Potvrdit fakta a téma.
- Klíč nepřesností se ukáže jen u uložené ukázky; u živé odpovědi modelu klíč není.

## `ss-level-1-cv2` · AiSandbox · stav draft

Model napíše krátký text. Najdi věty, kterým nevěříš, a ke každé napiš, jak bys ověřil(a), jestli je pravdivá.

**Cvičení na stránce: AiSandbox**

```json
{
  "mode": "fact-check",
  "topicLabel": "Karel IV."
}
```

**K potvrzení vlastníkem**

- Plán říká, že sadu výstupů s chybami připraví učitel. Aplikace proto neobsahuje sadu chyb; nabízí jen jedno téma (Karel IV.) s uloženou ukázkou, do které jsem záměrně vložil dvě nepřesnosti (rok 1857 místo 1357 a vymyšlená kronika). Potvrdit fakta a téma.
- Klíč nepřesností se ukáže jen u uložené ukázky; u živé odpovědi modelu klíč není.

