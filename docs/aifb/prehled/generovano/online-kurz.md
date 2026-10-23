<!-- Vygenerováno skriptem scripts/aifb-docs.mjs (npm run docs:aifb). Needitovat ručně. -->

# Online kurz pro všechny: celý text

Stav: **draft**. Samostatný online kurz AI gramotnosti pro všechny, sestavený z témat všech tří kategorií AIFB (1. stupeň ZŠ, 2. stupeň ZŠ, SŠ). Návrh: čeká na odbornou kontrolu vlastníkem (pravidlo R7). Do schválení se zobrazuje jen ve vývoji a v náhledových nasazeních.

Soubor: `src/content/aifb/aifb-kurz.json`. Celkem 7925 slov.

*AI gramotnost od základů po agenty, pro děti i dospělé*

Šest modulů, které tě provedou tím nejdůležitějším z AI gramotnosti: co umělá inteligence je, jak se jí ptát, jak ověřovat její odpovědi, jak chránit soukromí, jak ji zapojit do učení a práce a jak funguje uvnitř. Každý modul začíná teorií a pokračuje krátkými lekcemi s cvičeními přímo na stránce.

**Pro koho:** Pro samostatné studium od 10 let i pro dospělé. Žádný AI nástroj ani účet nepotřebuješ.

**Jak kurz funguje**

- Každý modul má teorii a čtyři lekce. Začni teorií, pak pokračuj lekcemi v pořadí.
- Cvičení běží přímo na stránce a nic neodesílají. Žádný AI nástroj ani účet nepotřebuješ.
- Průběh se ukládá jen v tomto prohlížeči. Hotové lekce si označ tlačítkem.
- Pokud je ti méně než 13 let, AI nástroje zkoušej jen s rodičem nebo učitelem.

## Přehled modulů

| Modul | Název | Délka | Vychází z | Teorie (slov) | Lekce |
|---|---|---|---|---|---|
| 1 | Co je umělá inteligence | 45 min | 1. stupeň ZŠ, Střední školy a gymnázia | 773 | 1. Najdi AI kolem sebe<br>2. Jak se program učí poznávat<br>3. Hádej další slovo<br>4. Kvíz: co AI umí a co ne |
| 2 | Jak se AI ptát | 50 min | 1. stupeň ZŠ, 2. stupeň ZŠ | 655 | 1. Poznej dobré zadání<br>2. Recept na zadání<br>3. Vylepši zadání<br>4. Pomáhá, nebo dělá za mě? |
| 3 | Pravda, nebo výmysl? | 50 min | 1. stupeň ZŠ, 2. stupeň ZŠ, Střední školy a gymnázia | 641 | 1. Detektiv halucinací<br>2. Tři zdroje<br>3. Fotka, nebo podvrh?<br>4. Moje pravidla ověřování |
| 4 | Soukromí a bezpečnost | 45 min | 1. stupeň ZŠ, 2. stupeň ZŠ, Střední školy a gymnázia | 625 | 1. Můžu to napsat do AI?<br>2. Rozřaď údaje<br>3. Anonymizuj text<br>4. Kvíz: bezpečně online |
| 5 | AI jako pomocník | 50 min | 2. stupeň ZŠ, Střední školy a gymnázia | 613 | 1. Plán na opakování<br>2. Správný formát<br>3. Navrhni pracovní postup<br>4. Kdo má rozhodnout? |
| 6 | Jak AI funguje uvnitř | 55 min | Střední školy a gymnázia | 735 | 1. Co si model pamatuje<br>2. AI s vlastní knihovnou<br>3. Agent na výletě<br>4. Závěrečný test kurzu |

---

## Modul 1: Co je umělá inteligence

*Kde ji potkáváme, jak se učí a co (ne)umí* · 45 min · adresa `/edu/ai-gramotnost/kurz/m1`

**Cíle**

- Vysvětlíš vlastními slovy, co je umělá inteligence a čím se liší od běžného programu.
- Najdeš umělou inteligenci ve věcech kolem sebe.
- Popíšeš, jak se program učí z příkladů a jak jazykový model skládá text.
- Řekneš, co AI umí dobře a v čem ji člověk nenahradí.

### Teorie (`kurz-m1-teorie`)

*Umělá inteligence není kouzlo, robot z filmu ani živá bytost. Je to druh programu, který se naučil z velkého množství příkladů. V tomto modulu zjistíš, kde ji potkáváš, jak se učí a proč je dobré jí rozumět, i když ji sám nikdy programovat nebudeš.*

#### Program, který se učil z příkladů `#co-to-je`

Běžný program dělá přesně to, co mu někdo krok za krokem napsal. Kalkulačka sečte dvě čísla vždycky stejně a nikdy se nic nového nenaučí. **Umělá inteligence** (zkráceně AI) funguje jinak: lidé jí nenapíšou všechna pravidla, ale ukážou jí obrovské množství příkladů. Program si v nich sám najde, co se opakuje, a podle toho se pak rozhoduje i v situacích, které ještě neviděl.

- **Běžný program:** Řídí se pravidly, která do něj napsal člověk. Dělá pořád totéž.
- **Umělá inteligence:** Naučila se z příkladů. Umí odhadnout odpověď i u nového případu, ale může se splést.
- **Robot:** Stroj, který se pohybuje a pracuje ve skutečném světě. Může, ale nemusí mít v sobě umělou inteligenci.

#### Krátce z historie `#historie`

Umělá inteligence není vynález posledních let. Vědci se o ni snaží přes sedmdesát let a několikrát změnili přístup.

- **1956:** na setkání vědců v americkém Dartmouthu poprvé zazní název „umělá inteligence“.
- **1997:** počítač Deep Blue porazí mistra světa v šachu. Hraje ale podle pravidel a výpočtů, ne podle příkladů.
- **Kolem roku 2012:** programy, které se učí z milionů obrázků, začnou spolehlivě poznávat, co na fotce je.
- **Od roku 2022:** konverzační nástroje, které píšou celé texty, používají stovky milionů lidí.

Velký skok přišel ve chvíli, kdy bylo k dispozici obrovské množství dat a dost výkonné počítače, aby se z nich program mohl učit.

#### Kde ji potkáváme `#kde`

Umělou inteligenci používáš častěji, než si myslíš. Bydlí v telefonu, v počítači, v autě i v obchodě. Většinou o ní ani nevíš, protože pracuje nenápadně na pozadí.

*[Ilustrace `ai-around-us`]* Hlasová asistentka, doporučená videa, fotoaparát, který najde obličej, i navigace: všude pracuje umělá inteligence.

- **Doporučování:** videa, písničky, zboží nebo příspěvky, které by tě mohly zajímat.
- **Rozpoznávání:** odemknutí telefonu obličejem, třídění fotek, čtení textu z obrázku.
- **Řeč a jazyk:** hlasoví asistenti, překladače, automatické titulky.
- **Konverzační nástroje:** programy, se kterými si „píšeš“ a které odpovídají celými větami.

#### Jak se program učí `#uceni`

Představ si, že chceme program naučit poznávat kočky a psy. Ukážeme mu tisíce fotek a u každé napíšeme, co na ní je. Program si všimne, čím se kočky a psi liší: tvarem uší, čumáku, velikostí. Potom dostane novou fotku a zkusí odhadnout, co na ní je.

*[Ilustrace `learn-from-examples`]* Program vidí mnoho označených příkladů. Pak sám odhadne, co je na novém obrázku.

Důležité je, že program kočce **nerozumí** tak jako ty. Nikdy ji nehladil a neví, jak mňouká. Pozná jen to, co se v příkladech opakovalo. Když jsou příklady špatné nebo jednostranné, naučí se špatně.

> **Jaká data, takový program** (info)
> Když program viděl jen červená jablka, zelené nepozná. Proto záleží na tom, kdo příklady vybírá a jestli jsou pestré.

#### Jak „píše“ konverzační nástroj `#jazykovy-model`

Konverzační nástroje stojí na **velkém jazykovém modelu**. Ten se učil na obrovském množství textů z knih, webových stránek a článků. Naučil se při tom jedinou věc: odhadnout, jaké slovo (přesněji kousek slova, **token**) nejspíš přijde dál.

*[Ilustrace `next-word`]* Model vybírá pravděpodobné pokračování textu. Odpověď skládá slovo po slově.

Když se ho na něco zeptáš, model skládá odpověď kousek po kousku. Proto odpovědi znějí plynule a přirozeně. Model ale nemá v hlavě encyklopedii, ve které by si fakta ověřoval. Ví jen, co zní pravděpodobně. A pravděpodobné nemusí být pravdivé.

#### Co umí dobře a co ne `#umi-neumi`

**Umí dobře**

- rychle shrnout dlouhý text,
- vysvětlit věc jinými slovy nebo na příkladu,
- navrhnout nápady, osnovu nebo otázky,
- přeložit a opravit text,
- najít vzor v obrovském množství dat.

**Neumí nebo nesmí**

- zaručit, že odpověď je pravdivá,
- vědět, co se stalo po skončení jeho učení,
- nést odpovědnost za rozhodnutí,
- mít opravdové city, názory nebo přátelství,
- rozhodnout, co je správné a spravedlivé.

> **Rozhoduje člověk** (tip)
> AI je nástroj, jako kalkulačka nebo slovník. Užitečný, ale za výsledek vždycky odpovídá ten, kdo ho použil.

#### Proč AI rozumět, i když ji neprogramuješ `#proc-rozumet`

AI ovlivňuje, jaká videa vidíš, jaké zprávy čteš, jak se učíš i jak budou vypadat povolání, která tě čekají. Kdo jí rozumí, používá ji jako nástroj. Kdo jí nerozumí, snadno jí uvěří víc, než by měl, nebo se jí zbytečně bojí.

**AI gramotnost** znamená vědět, co AI umí a neumí, umět se jí správně zeptat, ověřit odpověď, chránit soukromí a rozhodnout, kdy ji použít a kdy ne. Přesně to tě čeká v dalších modulech.

#### Shrnutí

- Umělá inteligence je program, který se naučil z příkladů, místo aby měl všechna pravidla napsaná.
- Potkáváš ji v doporučování, rozpoznávání obrázků, překladačích i konverzačních nástrojích.
- Jazykový model skládá text podle toho, co zní pravděpodobně, ne podle toho, co je pravda.
- AI nemá city ani odpovědnost. Rozhoduje a odpovídá člověk.

### Lekce 1: Najdi AI kolem sebe (`kurz-m1-cv1`, 10 min)

Některé stroje dělají pořád totéž, jiné se rozhodují podle toho, co vidí nebo slyší. Zkus je rozlišit.

**Postup**

1. Přečti si karty s věcmi, které znáš z domova, ze školy nebo z města.
2. Každou kartu dej do hromádky, kam podle tebe patří.
3. U karet, kde sis nebyl jistý, si řekni, proč ses rozhodl právě takhle.

**Cvičení na stránce: CardSort**

- Doporučená videa na tabletu → **Je v tom umělá inteligence**
- Kalkulačka → **Dělá pořád totéž, bez AI**
- Odemknutí telefonu obličejem → **Je v tom umělá inteligence**
- Vypínač světla → **Dělá pořád totéž, bez AI**
- Automatický překladač → **Je v tom umělá inteligence**
- Budík nastavený na 7:00 → **Dělá pořád totéž, bez AI**
- Navigace, která objede zácpu → **Je v tom umělá inteligence**
- Rychlovarná konvice → **Dělá pořád totéž, bez AI**

> **Tip:** Stopy umělé inteligence: rozumí řeči, pozná obrázek, doporučuje, hádá, co chceš napsat.

**Co si odneseš:** Umíš rozlišit běžný stroj od programu s umělou inteligencí a víš, podle čeho to poznat.

### Lekce 2: Jak se program učí poznávat (`kurz-m1-cv2`, 10 min)

Vyzkoušej si, jak program přemýšlí o příkladech. Odpověz na otázky a přečti si vysvětlení.

**Postup**

1. Odpověz na každou otázku a klikni na Zkontrolovat.
2. Když odpověď nesedí, přečti si vysvětlení a zkus to znovu.
3. Na závěr si zkus jednou větou říct, co znamená „učit se z příkladů“.

**Cvičení na stránce: QuizCard**

1. Program viděl tisíce fotek koček a psů s popiskem. Co udělá s novou fotkou?
   - ▫️ Zeptá se člověka, co na ní je.
   - ✅ Odhadne, co na ní je, podle toho, co se v příkladech opakovalo.
   - ▫️ Vždycky pozná správně, co na ní je.
   - *Vysvětlení:* Program odhaduje podle vzorů z příkladů. Odhad je často dobrý, ale ne vždy správný.

2. Program viděl jen červená jablka. Co se stane, když uvidí zelené?
   - ✅ Nejspíš ho nepozná.
   - ▫️ Pozná ho, jablko je jablko.
   - ▫️ Změní barvu jablka.
   - *Vysvětlení:* Program zná jen to, co viděl. Proto potřebuje pestré příklady.

3. Rozumí program kočce tak jako ty?
   - ▫️ Ano, ví o kočkách všechno.
   - ✅ Ne, jen pozná tvary a vzory, které se opakovaly.
   - ▫️ Ano, ale jen když je kočka na fotce.
   - *Vysvětlení:* Program kočku nikdy nehladil a neví, jak mňouká. Pozná jen vzory v obrázcích.

**Co si odneseš:** Víš, proč záleží na tom, z jakých příkladů se program učí.

### Lekce 3: Hádej další slovo (`kurz-m1-cv3`, 15 min)

Jazykový model skládá text tak, že odhaduje další slovo. Zkus si to sám a uvidíš, proč odpovědi znějí přirozeně, i když nemusí být pravdivé.

**Postup**

1. Vezmi papír nebo otevři poznámky.
2. Napiš si pět začátků vět, například: „Ráno jsem snědl…“, „Hlavní město Francie je…“, „Nejlepší film všech dob je…“.
3. Ke každé větě doplň slovo, které tě napadne jako první. Pokud můžeš, zeptej se i někoho dalšího.
4. Porovnejte odpovědi. Kde jste se shodli a kde ne?
5. Zamysli se: u které věty je „nejčastější“ odpověď zároveň pravdivá a u které jde jen o názor?

> **Tip:** Takhle pracuje i model, jen místo pěti vět viděl miliardy a pravděpodobnost počítá přesně.

**Co si odneseš:** Chápeš, že jazykový model vybírá pravděpodobné pokračování a že pravděpodobné neznamená vždycky pravdivé.

### Lekce 4: Kvíz: co AI umí a co ne (`kurz-m1-cv4`, 10 min)

Ověř si, co sis z modulu zapamatoval.

**Postup**

1. Odpověz na všechny otázky.
2. Po každé kontrole si přečti vysvětlení.
3. Když budeš mít méně než čtyři správně, vrať se k teorii.

**Cvičení na stránce: QuizCard**

1. Čím se umělá inteligence liší od kalkulačky?
   - ▫️ Je rychlejší.
   - ✅ Naučila se z příkladů a umí odhadnout odpověď i u nového případu.
   - ▫️ Nikdy se nemýlí.
   - *Vysvětlení:* Kalkulačka má pevná pravidla. AI se učila z příkladů, a proto se umí přizpůsobit, ale i splést.

2. Jak jazykový model tvoří odpověď?
   - ▫️ Najde ji v jedné velké encyklopedii.
   - ✅ Skládá ji kousek po kousku podle toho, co zní pravděpodobně.
   - ▫️ Zeptá se na internetu člověka.
   - *Vysvětlení:* Model odhaduje další token. Proto odpověď zní plynule, i když může být chybná.

3. Co AI umí dobře?
   - ▫️ Zaručit pravdivost odpovědi.
   - ✅ Shrnout dlouhý text nebo vysvětlit látku jinými slovy.
   - ▫️ Nést odpovědnost za rozhodnutí.
   - *Vysvětlení:* Shrnování a vysvětlování jsou silné stránky. Pravdivost a odpovědnost zůstávají na člověku.

4. Má konverzační nástroj opravdové city?
   - ▫️ Ano, když píše mile.
   - ✅ Ne, jen napodobuje způsob, jakým píšou lidé.
   - ▫️ Jen někdy.
   - *Vysvětlení:* Milý tón se model naučil z textů. Nic necítí.

5. Kdo odpovídá za práci, při které pomohla AI?
   - ▫️ Firma, která AI vyrobila.
   - ✅ Ten, kdo AI použil a výsledek odevzdal.
   - ▫️ Nikdo.
   - *Vysvětlení:* AI je nástroj. Odpovědnost má člověk, který s ním pracuje.

**Co si odneseš:** Shrnul sis hlavní myšlenky modulu a víš, kde se k nim vrátit.

---

## Modul 2: Jak se AI ptát

*Dobré zadání, recept a ladění odpovědi* · 50 min · adresa `/edu/ai-gramotnost/kurz/m2`

**Cíle**

- Sestavíš zadání z role, úkolu, kontextu a podoby výstupu.
- Poznáš slabé zadání a umíš ho vylepšit.
- Zadání postupně ladíš, místo abys začínal pořád znovu.
- Víš, kdy AI pomáhá učení a kdy ho nahrazuje.

### Teorie (`kurz-m2-teorie`)

*Jak se zeptáš, tak ti odpoví. Kvalita odpovědi z konverzačního nástroje hodně záleží na tom, jak přesně popíšeš, co chceš. V tomto modulu se naučíš recept na dobré zadání a postup, jak odpověď vylepšovat.*

#### Co je zadání (prompt) `#prompt`

Text, který napíšeš konverzačnímu nástroji, se nazývá **zadání** nebo anglicky **prompt**. Model nevidí, co máš v hlavě. Zná jen to, co mu napíšeš. Když napíšeš „napiš něco o vesmíru“, dostaneš obecný text, který ti nejspíš k ničemu nebude.

Dobré zadání není kouzelná formulka. Je to jasná domluva, podobně jako když vysvětluješ úkol kamarádovi, který u toho nebyl: kdo má co udělat, pro koho, proč a jak má výsledek vypadat.

#### Recept na dobré zadání `#recept`

*[Ilustrace `prompt-blocks`]* Role, kontext, úkol a podoba výstupu: čtyři kostky, ze kterých se staví dobré zadání.

- **Role:** Kým má model být: trpělivý učitel, kritický čtenář, průvodce po muzeu.
- **Kontext:** Co má vědět o situaci: pro koho to je, k čemu to poslouží, co už víš.
- **Úkol:** Co přesně má udělat: vysvětlit, shrnout, navrhnout, zkontrolovat.
- **Podoba výstupu:** Jak má odpověď vypadat: pět bodů, tabulka, krátký odstavec, otázky s odpověďmi.

**Slabé a lepší zadání**

```
Slabé: Napiš něco o vesmíru.

Lepší: Jsi průvodce v planetáriu. Vysvětli desetiletému dítěti, proč Měsíc mění tvar. Použij nejvýš pět krátkých vět a jedno přirovnání z běžného života.
```

#### Pro koho a jak dlouhé `#pro-koho`

Stejnou věc vysvětlíš jinak spolužákovi a jinak babičce. Model to neví, dokud mu to neřekneš. Napiš, pro koho odpověď je, jak má být dlouhá a jakým tónem má mluvit.

**Užitečná upřesnění**

- „Pro žáka 4. třídy, krátkými větami.“
- „Do referátu, odborně, ale srozumitelně.“
- „Jako vypravěč dobrodružného příběhu.“
- „Nejvýš 100 slov.“

#### Ukaž příklad `#ukazky`

Někdy je těžké popsat slovy, co přesně chceš. Pak pomůže přidat do zadání **ukázku**: jeden nebo dva příklady toho, jak má výsledek vypadat. Model se podle nich zorientuje rychleji než podle dlouhého popisu.

**Zadání s ukázkou**

```
Vymysli pět hádanek o zvířatech pro děti. Dodrž tento tvar:

Mám dlouhý krk a jím listy ze stromů. Kdo jsem? (žirafa)
```

Ukázka ale model svazuje. Když chceš pestré nápady, dej raději víc různých ukázek, nebo žádnou.

#### Zadání se ladí `#ladeni`

První odpověď málokdy sedí dokonale. Nezačínej pokaždé od nuly. Přečti si odpověď, najdi, co chybí, a napiš doplňující pokyn: „Zkrať to na polovinu“, „Přidej příklad ze sportu“, „Udělej z toho tabulku“.

*[Ilustrace `ask-check`]* Zeptáme se, přečteme si odpověď a ověříme ji. Pak zadání podle potřeby upravíme.

1. Napiš první verzi zadání.
2. Přečti odpověď a najdi, co nesedí.
3. Doplň jeden konkrétní pokyn.
4. Opakuj, dokud výsledek není použitelný.

> **Nech se doptat** (tip)
> Napiš na konec zadání: „Pokud ti něco chybí, nejdřív se mě zeptej.“ Model se pak doptá místo toho, aby hádal.

#### Nejčastější chyby `#chyby`

- **Vágní úkol:** „Pomoz mi s úkolem.“ S jakým, pro koho a k čemu?
- **Moc věcí najednou:** Shrnutí, test, slovníček i prezentace v jedné zprávě. Každá část dopadne napůl.
- **Protichůdné pokyny:** „Velmi stručně, ale se všemi podrobnostmi.“
- **Osobní údaje:** Jména, adresy a fotky do zadání nepatří. Víc v modulu 4.

#### Kdy začít nový rozhovor `#znovu`

V dlouhém rozhovoru si model drží celou historii. Čím je delší, tím snáz zapomene pokyny ze začátku nebo se točí v kruhu. Když se změní téma nebo odpovědi přestanou sedět, začni novou konverzaci.

> **Shrnutí na cestu** (tip)
> Před novým začátkem si nech od modelu napsat krátké shrnutí toho, co jste vyřešili. To vložíš do nové konverzace a pokračuješ s čistým stolem.

#### Učit se s AI, ne místo sebe `#uceni`

Když úkol trénuje tvoji dovednost, třeba psaní slohu nebo počítání příkladů, nenech AI udělat práci za tebe. Nauč se tím méně a učitel to často pozná. Požádej ji raději o vysvětlení, nápovědu nebo kontrolu toho, co jsi udělal sám.

> **Dobré otázky pro učení** (info)
> „Vysvětli mi to jinak.“ „Dej mi nápovědu, ale ne řešení.“ „Zkontroluj můj postup a řekni, kde je chyba.“ „Vymysli mi tři podobné příklady na procvičení.“

#### Shrnutí

- Model zná jen to, co mu napíšeš. Zadání je jasná domluva.
- Recept: role, kontext, úkol a podoba výstupu.
- Odpověď se ladí doplňujícími pokyny, nezačíná se pořád znovu.
- AI má pomáhat učení: vysvětlovat a kontrolovat, ne dělat úkoly za tebe.

### Lekce 1: Poznej dobré zadání (`kurz-m2-cv1`, 10 min)

Ne každé zadání je stejně dobré. Vyber, které z nich dá nejpoužitelnější odpověď.

**Postup**

1. Přečti si vždy všechny možnosti.
2. Vyber tu, která nejlépe popisuje roli, úkol, kontext a podobu výstupu.
3. Přečti si vysvětlení.

**Cvičení na stránce: QuizCard**

1. Chceš se připravit na test ze zeměpisu o řekách Česka. Které zadání je nejlepší?
   - ▫️ Řeky.
   - ▫️ Napiš něco o řekách.
   - ✅ Jsi učitel zeměpisu. Připrav mi pro 6. třídu deset otázek s odpověďmi o největších řekách Česka. Formát: číslovaný seznam.
   - *Vysvětlení:* Třetí zadání říká roli, pro koho, co přesně a v jaké podobě.

2. Které upřesnění pomůže, když je odpověď moc dlouhá a složitá?
   - ▫️ Napiš to znovu.
   - ✅ Zkrať to na pět krátkých vět pro žáka 4. třídy.
   - ▫️ Je to špatně.
   - *Vysvětlení:* Konkrétní pokyn (délka, publikum) funguje lépe než obecná nespokojenost.

3. Co patří do podoby výstupu?
   - ▫️ Kým má model být.
   - ✅ Jestli chceš tabulku, body nebo krátký odstavec.
   - ▫️ Tvoje jméno.
   - *Vysvětlení:* Podoba výstupu popisuje, jak má odpověď vypadat.

**Co si odneseš:** Umíš rozpoznat, co dělá zadání dobrým.

### Lekce 2: Recept na zadání (`kurz-m2-cv2`, 10 min)

Rozlož hotové zadání na jednotlivé části receptu.

**Postup**

1. Zadání zní: „Jsi trpělivý trenér. Chystám se poprvé běžet 5 km a mám na přípravu šest týdnů. Navrhni mi tréninkový plán. Udělej z něj tabulku po týdnech.“
2. Každou kartu zařaď do správné části receptu.
3. Zamysli se, která část v zadání chybí nejčastěji, když se ptáš ty.

**Cvičení na stránce: CardSort**

- Jsi trpělivý trenér. → **Role**
- Chystám se poprvé běžet 5 km. → **Kontext**
- Mám na přípravu šest týdnů. → **Kontext**
- Navrhni mi tréninkový plán. → **Úkol**
- Udělej z něj tabulku po týdnech. → **Podoba výstupu**

**Co si odneseš:** Umíš rozpoznat roli, kontext, úkol a podobu výstupu v jakémkoli zadání.

### Lekce 3: Vylepši zadání (`kurz-m2-cv3`, 15 min)

Přepiš tři slabá zadání podle receptu. Nepotřebuješ k tomu žádný AI nástroj, stačí papír nebo poznámky.

**Postup**

1. Slabá zadání: „Pomoz mi s úkolem.“, „Napiš příběh.“, „Řekni mi něco o zdravém jídle.“
2. Ke každému si vymysli situaci: kdo se ptá, k čemu odpověď potřebuje.
3. Přepiš zadání tak, aby obsahovalo roli, kontext, úkol a podobu výstupu.
4. Zkontroluj, že v zadání nejsou žádné osobní údaje.
5. Pokud smíš konverzační nástroj používat (podle jeho věkových podmínek, mladší s rodičem), porovnej odpověď na slabé a na vylepšené zadání.

> **Tip:** Dobré zadání bývá delší než slabé. To je v pořádku: dvě věty navíc ušetří deset minut opravování.

**Co si odneseš:** Tři vylepšená zadání, u kterých umíš ukázat všechny čtyři části receptu.

### Lekce 4: Pomáhá, nebo dělá za mě? (`kurz-m2-cv4`, 10 min)

Rozhodni u každé situace, jestli AI pomáhá učení, nebo práci dělá místo tebe.

**Postup**

1. Přečti si situaci.
2. Vyber, jestli je to v pořádku, nebo ne.
3. Přečti si zpětnou vazbu.

**Cvičení na stránce: TrafficLightCards**

Tlačítka: zelená „Pomáhá mi učit se“, červená „Dělá práci za mě“.

- Napíšu sloh sám a požádám AI, ať mi ukáže pravopisné chyby. → **Pomáhá mi učit se** (Text je tvůj, AI jen kontroluje. Chyby si oprav sám.)
- Nechám AI napsat celý sloh a odevzdám ho jako svůj. → **Dělá práci za mě** (Nic ses nenaučil a není to poctivé.)
- Nerozumím zlomkům. Požádám AI, ať mi je vysvětlí na pizze. → **Pomáhá mi učit se** (Vysvětlení jinými slovy je skvělé využití.)
- Vyfotím domácí úkol z matematiky a opíšu výsledky. → **Dělá práci za mě** (Výsledky bez postupu tě nic nenaučí. Požádej raději o nápovědu.)
- Požádám AI o pět podobných příkladů na procvičení. → **Pomáhá mi učit se** (Procvičování na nových příkladech pomáhá.)
- Požádám AI o nápovědu k prvnímu kroku, ale ne o celé řešení. → **Pomáhá mi učit se** (Nápověda tě posune a přemýšlíš dál sám.)

**Co si odneseš:** Víš, jak používat AI tak, aby ses při tom něco naučil.

---

## Modul 3: Pravda, nebo výmysl?

*Halucinace, ověřování a vyrobené obrázky* · 50 min · adresa `/edu/ai-gramotnost/kurz/m3`

**Cíle**

- Vysvětlíš, proč si jazykový model někdy vymýšlí.
- Ověříš konkrétní tvrzení v nezávislém zdroji.
- Poznáš varovné signály u textů, obrázků a videí.
- Víš, co udělat, když narazíš na chybnou nebo podezřelou informaci.

### Teorie (`kurz-m3-teorie`)

*Konverzační nástroj odpovídá vždycky sebejistě, i když se mýlí. Obrázek může vypadat jako fotka, i když se nic takového nestalo. V tomto modulu se naučíš číst s otazníkem a ověřovat, co je pravda.*

#### Proč si model vymýšlí `#halucinace`

Už víš, že jazykový model skládá odpověď podle toho, co zní pravděpodobně. Když o něčem v textech, ze kterých se učil, nebylo dost informací, model nepřizná, že neví. Doplní něco, co zní věrohodně. Takové vymyšlené odpovědi se říká **halucinace**.

*[Ilustrace `hallucination`]* Model napíše nepravdu stejně sebejistě jako pravdu. Pozná to až ověření.

**Co si model vymýšlí nejčastěji**

- neexistující knihy, články nebo citace,
- špatná data, čísla a jména,
- vymyšlené podrobnosti o skutečných lidech,
- zdroje a odkazy, které nikam nevedou.

> **Sebejistý tón nic nedokazuje** (warning)
> Model nepíše „možná“ ani „nevím“ tak často, jak by měl. To, že odpověď zní jistě, neznamená, že je pravdivá.

#### Proč máme sklon věřit `#proc-verime`

Lidé mají sklon věřit odpovědím, které jsou napsané plynule, sebejistě a bez chyb. Navíc máme pocit, že počítač „to přece musí vědět“. Tomuto sklonu se říká **důvěra v automat** a je jedním z důvodů, proč se halucinace snadno šíří.

**Kdy být zvlášť opatrný**

- Odpověď je dlouhá a podrobná, a tak působí důvěryhodně.
- Model používá odborná slova a čísla.
- Odpověď potvrzuje to, co si sami myslíme.

Pomáhá jednoduchý zvyk: u každé důležité odpovědi se zeptej sám sebe, odkud bych věděl, že je to pravda.

#### Jak ověřovat `#overovani`

Ověřovat nemusíš každé slovo. Zaměř se na konkrétní tvrzení, na kterých něco stojí: jména, data, čísla, citace a rady, podle kterých se chceš řídit.

1. Najdi v odpovědi konkrétní tvrzení.
2. Vyhledej ho v nezávislém zdroji: v učebnici, encyklopedii, na oficiálních stránkách.
3. U knih a článků ověř, že opravdu existují.
4. Když se zdroje neshodují, věř tomu důvěryhodnějšímu a zeptej se odborníka.
5. Důležité rozhodnutí (zdraví, peníze, škola) nikdy nestav jen na odpovědi AI.

*[Ilustrace `ask-check`]* Zeptat se, přečíst a ověřit. Třetí krok je nejdůležitější.

#### Který zdroj je důvěryhodný `#zdroje`

- **Kdo to napsal?:** Je uvedený autor nebo instituce? Rozumí tématu?
- **Kdy?:** Je informace aktuální? U zpráv a technologií na tom hodně záleží.
- **Proč?:** Chce tě zdroj informovat, nebo ti něco prodat či tě rozzlobit?
- **Píšou to i jinde?:** Shodují se na tom další, na sobě nezávislé zdroje?

Model sám o sobě zdroj není. Do práce proto necituj „řekla mi to AI“, ale zdroj, ve kterém sis informaci ověřil.

#### Zkreslené odpovědi `#zkresleni`

Model se učil z textů, které napsali lidé, a s nimi převzal i jejich předsudky. Může opakovat stereotypy o povoláních, o dívkách a chlapcích nebo o lidech z různých zemí. Taková odpověď nemusí obsahovat vymyšlený fakt, a přesto je nespravedlivá.

*[Ilustrace `fair-data`]* Z jednostranných příkladů vznikají jednostranné odpovědi.

Když ti odpověď přijde jednostranná, zeptej se jinak, požádej o další pohledy nebo vyměň v otázce jednu vlastnost a porovnej výsledek.

#### Vyrobené obrázky, hlasy a videa `#obrazky`

Umělá inteligence umí vytvořit obrázek, který vypadá jako fotografie, napodobit hlas známého člověka nebo upravit video tak, že v něm někdo říká, co nikdy neřekl. Takovým podvrhům se říká **deepfake**.

*[Ilustrace `ai-made`]* U obrázku se ptáme: Kdo ho vyrobil? Kde se to stalo? Píšou o tom i jinde?

**Varovné signály**

- Vypadá něco divně: ruce, prsty, písmena, stíny, odrazy?
- Ukazují totéž i důvěryhodná média?
- Vyvolává to ve mně silnou emoci a chce, abych to hned sdílel?
- Kdo to zveřejnil jako první?

> **Zastav se před sdílením** (tip)
> Podvrhy se šíří, protože je lidé rychle posílají dál. Když tě něco hodně vyleká nebo rozzlobí, nejdřív to ověř.

#### Co dělat, když narazíš na chybu `#co-delat`

- Napiš modelu, že odpověď nesedí, a požádej o opravu nebo zdroj.
- Chybnou informaci dál nešiř.
- U obrázků a videí, které někomu ubližují, to řekni dospělému nebo nahlas správci stránky.
- Když jde o tebe nebo kamaráda, nečekej a požádej o pomoc.

#### Shrnutí

- Halucinace je vymyšlená odpověď, která zní věrohodně.
- Ověřuj konkrétní tvrzení v nezávislých zdrojích, hlavně jména, data, čísla a citace.
- Obrázky, hlasy i videa mohou být vyrobené. Hledej varovné signály a zastav se před sdílením.
- AI není zdroj. Cituj zdroj, ve kterém sis informaci ověřil.

### Lekce 1: Detektiv halucinací (`kurz-m3-cv1`, 10 min)

Model odpověděl na pět otázek. Některé odpovědi jsou pravdivé, jiné vymyšlené. Rozhodni, které by sis měl ověřit.

**Postup**

1. Přečti si odpověď modelu.
2. Rozhodni, jestli jí můžeš věřit bez ověření, nebo jestli ji musíš ověřit.
3. Přečti si zpětnou vazbu.

**Cvičení na stránce: TrafficLightCards**

Tlačítka: zelená „Běžná věc, sedí“, červená „Musím ověřit“.

- „Voda se při normálním tlaku vaří při 100 °C.“ → **Běžná věc, sedí** (Běžně známý fakt, který najdeš v každé učebnici.)
- „Podle studie Univerzity v Brně z roku 2019 spí žáci průměrně 6,2 hodiny.“ → **Musím ověřit** (Konkrétní studie, rok a číslo: přesně to si model často vymýšlí. Ověř, že studie existuje.)
- „Doporučuji knihu Tajemství modrého lesa od Jany Novákové.“ → **Musím ověřit** (Názvy knih a autoři patří k nejčastějším halucinacím. Ověř v knihovně.)
- „Pavouk má osm nohou.“ → **Běžná věc, sedí** (Správně, a snadno se to ověří v encyklopedii.)
- „Tohle léčivo můžeš brát s jakýmkoli jiným lékem.“ → **Musím ověřit** (Rady o zdraví nikdy neber jen od AI. Zeptej se lékaře nebo lékárníka.)

**Co si odneseš:** Poznáš, které typy tvrzení jsou na halucinace nejnáchylnější.

### Lekce 2: Tři zdroje (`kurz-m3-cv2`, 15 min)

Vyber si jedno tvrzení a ověř ho ve třech nezávislých zdrojích. Naučíš se tím postup, který budeš potřebovat celý život.

**Postup**

1. Vyber si tvrzení, například: „Nejvyšší hora Česka je Sněžka a měří 1 603 metrů.“ nebo tvrzení z odpovědi AI, kterou jsi dostal.
2. Najdi první zdroj: učebnici, atlas nebo encyklopedii.
3. Najdi druhý zdroj: oficiální stránky instituce (úřad, muzeum, univerzita).
4. Najdi třetí zdroj, který na prvních dvou nezávisí.
5. Zapiš si u každého zdroje: kdo ho napsal, kdy a co přesně tvrdí.
6. Rozhodni: je tvrzení pravdivé, částečně pravdivé, nebo nepravdivé?

> **Tip:** Když se zdroje liší v malém detailu (třeba výška hory o metr), napiš to. Přesnost je součást ověřování.

**Co si odneseš:** Krátký záznam: tvrzení, tři zdroje a tvůj závěr.

### Lekce 3: Fotka, nebo podvrh? (`kurz-m3-cv3`, 10 min)

Naučíš se, na co se dívat, když nevíš, jestli je obrázek nebo zpráva skutečná.

**Postup**

1. Přečti si otázky.
2. Vyber odpověď a přečti si vysvětlení.
3. Zapamatuj si tři otázky: Kdo to vyrobil? Kde se to stalo? Píšou o tom i jinde?

**Cvičení na stránce: QuizCard**

1. Kamarád ti pošle video, kde známá zpěvačka říká něco šokujícího. Co uděláš nejdřív?
   - ▫️ Pošlu ho dál, ať to všichni vidí.
   - ✅ Podívám se, jestli o tom píšou důvěryhodná média.
   - ▫️ Napíšu zpěvačce.
   - *Vysvětlení:* Šokující obsah je častý znak podvrhu. Nejdřív ověř.

2. Na fotce má člověk šest prstů a písmena na ceduli nedávají smysl. Co to může znamenat?
   - ✅ Obrázek mohla vyrobit AI.
   - ▫️ Fotka je jen rozmazaná.
   - ▫️ Nic, to se stává.
   - *Vysvětlení:* Ruce a písmena jsou místa, kde vyrobené obrázky často chybují.

3. Proč se podvrhy šíří tak rychle?
   - ▫️ Protože jsou pravdivé.
   - ✅ Protože vyvolávají silné emoce a lidé je hned sdílejí.
   - ▫️ Protože je šíří jen roboti.
   - *Vysvětlení:* Silná emoce nás nutí jednat rychle. Zastav se a ověř.

4. Co uděláš, když najdeš vyrobený obrázek, který ubližuje spolužákovi?
   - ▫️ Nic, není to moje věc.
   - ✅ Řeknu to dospělému a nahlásím ho správci stránky.
   - ▫️ Pošlu ho dál, ať se o tom ví.
   - *Vysvětlení:* Pomoz zastavit šíření a požádej o pomoc dospělého.

**Co si odneseš:** Víš, podle čeho poznat podezřelý obrázek nebo zprávu a co s nimi dělat.

### Lekce 4: Moje pravidla ověřování (`kurz-m3-cv4`, 10 min)

Sepiš si krátký tahák, podle kterého budeš ověřovat informace z AI i z internetu.

**Postup**

1. Napiš si nadpis „Než tomu uvěřím…“.
2. Doplň pod něj pět otázek nebo kroků, které si budeš klást. Můžeš vycházet z teorie, ale napiš je vlastními slovy.
3. Přidej jeden příklad situace, kdy ti ověření pomohlo, nebo kdy by pomohlo.
4. Tahák si ulož nebo vytiskni a dej ho na místo, kde se učíš.

> **Tip:** Krátký tahák, který opravdu používáš, je lepší než dlouhý seznam, který zapadne.

**Co si odneseš:** Vlastní tahák s pěti kroky ověřování.

---

## Modul 4: Soukromí a bezpečnost

*Co do AI nepatří a jak se chránit* · 45 min · adresa `/edu/ai-gramotnost/kurz/m4`

**Cíle**

- Rozlišíš údaje, které do AI nástroje patří, a ty, které ne.
- Upravíš text tak, aby neprozradil nic o konkrétních lidech.
- Znáš věkové podmínky a pravidla bezpečného používání.
- Víš, jak reagovat, když se tě aplikace nebo cizí člověk ptá na osobní věci.

### Teorie (`kurz-m4-teorie`)

*To, co napíšeš do AI nástroje, opouští tvůj počítač. V tomto modulu se naučíš, které informace si nechat pro sebe, jak text upravit, aby nikoho neprozradil, a jak AI nástroje používat bezpečně.*

#### Kam putují data `#kam-jdou`

Když napíšeš zprávu do konverzačního nástroje, odešle se na servery firmy, která nástroj provozuje. Tam se zpracuje a často i uloží. Podle podmínek služby ji firma někdy používá ke zlepšování svých modelů a v některých případech ji mohou číst i lidé, kteří kvalitu kontrolují.

Neznamená to, že AI nástroje jsou zlé. Znamená to, že bys do nich měl psát jen to, co bys klidně řekl i cizímu člověku na ulici.

#### Co do AI nepatří `#co-ne`

*[Ilustrace `privacy-sort`]* Obecné otázky a učivo do AI patří. Jména, adresy, fotky a hesla ne.

**Nikdy nezadávej**

- celé jméno, adresa, telefon, e-mail,
- fotky obličejů, tvoje i cizí,
- hesla, PIN, čísla karet, rodné číslo,
- údaje o zdraví, rodině a známkách,
- cokoli o spolužácích, kamarádech nebo kolezích, co by nechtěli zveřejnit.

> **Pravidlo cizího člověka** (tip)
> Než něco odešleš, zeptej se: řekl bych to cizímu člověku na zastávce? Když ne, do AI to nepatří.

#### Fotky a hlasy druhých lidí `#druzi`

Fotka nebo nahrávka kamaráda patří jemu, ne tobě. Když ji vložíš do AI nástroje, upravíš nebo z ní necháš vyrobit něco nového, rozhoduješ o něm bez jeho souhlasu.

> **Vyrobené obrázky ubližují** (warning)
> Upravit fotku spolužáka tak, aby vypadal směšně nebo ponižujícím způsobem, není vtip. Může ho to hodně zranit a v některých případech jde i o trestný čin. Když se něco takového děje kolem tebe, řekni to dospělému.

#### Jak text upravit `#anonymizace`

Někdy potřebuješ pomoc s textem, ve kterém jsou skuteční lidé, třeba se zápisem ze schůzky nebo s příběhem z tábora. Před vložením text **anonymizuj**: nahraď údaje, podle kterých by šlo lidi poznat, obecnými označeními.

**Před a po**

```
Před: Petr Novák z 6.B bydlí v Lipové 12 a minulý týden dostal pětku z matiky.

Po: Žák A z naší třídy dostal minulý týden špatnou známku z matematiky.
```

**Co nahradit**

- jména → Žák A, Kamarádka B, Kolega C,
- adresy a místa → obecné místo (naše ulice, škola),
- přesná data a čísla → přibližně, pokud nejsou potřeba,
- fotky → nahraď popisem nebo je vůbec nepoužívej.

#### Věkové podmínky a souhlas `#vek`

Konverzační nástroje mají věkové podmínky. Mnohé nejsou určené dětem do 13 let a mladší 18 let je smějí používat jen se souhlasem rodičů, některé jen dospělí. Podmínky se mění, proto si je vždy přečti u konkrétní služby.

> **Mladší 13 let** (warning)
> AI nástroje zkoušej jen s rodičem nebo učitelem. Všechna cvičení v tomto kurzu zvládneš i bez nich.

#### Triky, na které si dát pozor `#triky`

- **Phishing:** Zpráva nebo stránka, která se tváří jako banka, škola nebo hra a chce tvoje heslo. AI umí psát velmi přesvědčivé podvodné zprávy bez chyb.
- **Falešný kamarád:** Někdo na internetu, kdo se vydává za vrstevníka a vyptává se na osobní věci.
- **Aplikace, které chtějí moc:** Hra nebo nástroj, který bez důvodu chce přístup k fotkám, kontaktům nebo poloze.

**Jak se chránit**

- Hesla nikdy nikomu neposílej, ani „podpoře“.
- Když si nejsi jistý, zeptej se dospělého nebo zavolej instituci na oficiální číslo.
- Zapni si dvoufázové ověření, kde to jde.

#### Silné heslo a dvoufázové ověření `#hesla`

Nejlepší ochrana účtů je dlouhé heslo, které nepoužíváš nikde jinde. Snadno si zapamatuješ **heslovou frázi** ze čtyř či pěti náhodných slov. Ještě lepší je správce hesel, který hesla vymyslí a pamatuje si je za tebe.

**Kontrolní seznam**

- Heslo je dlouhé (aspoň 12 znaků) a jedinečné pro každou službu.
- Nikdy ho neposíláš zprávou, e-mailem ani do AI nástroje.
- Kde to jde, zapneš **dvoufázové ověření**: kromě hesla potvrdíš přihlášení kódem v telefonu.

#### Shrnutí

- Co napíšeš do AI nástroje, odchází na servery firmy a může se uložit.
- Jména, adresy, fotky, hesla a údaje o druhých do AI nepatří.
- Text o skutečných lidech před vložením anonymizuj.
- Respektuj věkové podmínky. Mladší 13 let zkoušejí AI jen s dospělým.

### Lekce 1: Můžu to napsat do AI? (`kurz-m4-cv1`, 10 min)

U každé věci rozhodni, jestli ji smíš napsat do konverzačního nástroje.

**Postup**

1. Přečti si situaci.
2. Vyber, jestli je to v pořádku, nebo ne.
3. Přečti si zpětnou vazbu.

**Cvičení na stránce: TrafficLightCards**

Tlačítka: zelená „Můžu napsat“, červená „Nepatří do AI“.

- „Vysvětli mi, jak funguje fotosyntéza.“ → **Můžu napsat** (Obecná otázka k učivu je v pořádku.)
- „Moje heslo je Kočka123, je dost silné?“ → **Nepatří do AI** (Heslo nikdy nikam nepiš. Zeptej se obecně, jak vypadá silné heslo.)
- Fotka třídy z výletu s prosbou, ať ji AI upraví. → **Nepatří do AI** (Fotky obličejů, hlavně cizích, do AI nepatří.)
- „Pomoz mi napsat přání k narozeninám pro babičku, která má ráda zahradu.“ → **Můžu napsat** (Žádné citlivé údaje, jen obecný popis.)
- „Jan Dvořák z naší třídy má ADHD, jak se k němu chovat?“ → **Nepatří do AI** (Jméno a zdravotní údaj o spolužákovi do AI nepatří. Zeptej se obecně, nebo dospělého.)
- Vlastní sloh bez jmen, se žádostí o kontrolu pravopisu. → **Můžu napsat** (Vlastní text bez osobních údajů je v pořádku.)

**Co si odneseš:** Umíš rychle rozhodnout, co do AI patří a co ne.

### Lekce 2: Rozřaď údaje (`kurz-m4-cv2`, 10 min)

Rozřaď údaje do hromádek podle toho, jak citlivé jsou.

**Postup**

1. Přečti si karty.
2. Každou zařaď do jedné hromádky.
3. U sporných karet si řekni, co by se mohlo stát, kdyby se údaj dostal ven.

**Cvičení na stránce: CardSort**

*Nápověda:* Osobní údaje prozradí, kdo jsi a kde tě najít. Zvlášť citlivé údaje mohou způsobit velkou škodu.

- Oblíbená barva → **Klidně sdílet**
- Název oblíbené knihy → **Klidně sdílet**
- Adresa bydliště → **Osobní: nesdílet**
- Telefonní číslo → **Osobní: nesdílet**
- Fotka obličeje → **Osobní: nesdílet**
- Heslo do e-mailu → **Zvlášť citlivé: nikdy**
- Rodné číslo → **Zvlášť citlivé: nikdy**
- Údaje o nemoci → **Zvlášť citlivé: nikdy**

**Co si odneseš:** Víš, které údaje jsou osobní a které jsou zvlášť citlivé.

### Lekce 3: Anonymizuj text (`kurz-m4-cv3`, 15 min)

Uprav text tak, aby nikoho neprozradil, ale pořád dával smysl. Pracuješ jen na papíře nebo v poznámkách.

**Postup**

1. Text k úpravě: „Včera jsme s Klárou Svobodovou a Tomášem Kratochvílem z 8.A připravovali projekt o Labi. Klára bydlí v Ústí, Husova 5, a její táta pracuje na přístavu. Tomáš neměl hotový svůj díl, protože byl nemocný.“
2. Podtrhni všechny údaje, podle kterých by šlo konkrétní lidi poznat.
3. Nahraď je obecným označením (Spolužačka A, Spolužák B, naše město…).
4. Vynech údaje, které pro úkol nejsou potřeba (adresa, zaměstnání táty, nemoc).
5. Přečti si upravený text. Dává pořád smysl pro žádost typu „pomoz mi naplánovat dokončení projektu“?

> **Tip:** Nejlepší anonymizace je údaj vůbec nepsat. Ptej se: potřebuje to AI k vyřešení úkolu?

**Co si odneseš:** Anonymizovaný text, ve kterém nikoho nepoznáš a který pořád poslouží svému účelu.

### Lekce 4: Kvíz: bezpečně online (`kurz-m4-cv4`, 10 min)

Ověř si, jak se zachovat v situacích, které se opravdu stávají.

**Postup**

1. Odpověz na otázky.
2. Přečti si vysvětlení.
3. Když si nejsi jistý, vrať se k sekci Triky, na které si dát pozor.

**Cvičení na stránce: QuizCard**

1. Přijde ti e-mail „ze školy“, ať se kvůli novému systému přihlásíš přes odkaz a zadáš heslo. Co uděláš?
   - ▫️ Kliknu a přihlásím se.
   - ✅ Neklikám a ověřím si to u učitele nebo na oficiálních stránkách školy.
   - ▫️ Pošlu heslo odpovědí.
   - *Vysvětlení:* Takhle vypadá phishing. Ověř si to jinou cestou.

2. Nová hra chce přístup k fotkám, kontaktům i poloze. Co je rozumné?
   - ▫️ Povolit všechno, jinak nepůjde hrát.
   - ✅ Povolit jen to, co hra opravdu potřebuje, a zbytek zakázat.
   - ▫️ Hru smazat a nikdy nic nestahovat.
   - *Vysvětlení:* Dávej aplikacím jen nutná oprávnění.

3. Kamarád z internetu, kterého jsi nikdy neviděl, chce tvoji fotku a adresu školy. Co uděláš?
   - ▫️ Pošlu, vypadá mile.
   - ✅ Nepošlu nic a řeknu to dospělému.
   - ▫️ Pošlu jen fotku.
   - *Vysvětlení:* Osobní údaje cizím lidem nikdy. Řekni to dospělému.

4. Proč nevkládat do AI jména spolužáků?
   - ▫️ Protože by AI nevěděla, kdo to je.
   - ✅ Protože údaje odcházejí na servery firmy a spolužák s tím nesouhlasil.
   - ▫️ Protože jména jsou dlouhá.
   - *Vysvětlení:* Údaje o druhých nejsou tvoje, nemůžeš je sdílet bez jejich souhlasu.

**Co si odneseš:** Víš, jak se zachovat, když po tobě někdo nebo něco chce osobní údaje.

---

## Modul 5: AI jako pomocník

*Učení, formáty výstupu a malé pracovní postupy* · 50 min · adresa `/edu/ai-gramotnost/kurz/m5`

**Cíle**

- Navrhneš, jak AI zapojit do vlastního učení.
- Požádáš o výstup ve správném formátu: seznam, tabulka, Markdown.
- Popíšeš pracovní postup jako spouštěč, kroky a výstup.
- Určíš, kde v postupu musí rozhodovat člověk.

### Teorie (`kurz-m5-teorie`)

*AI nástroje umí ušetřit spoustu času, když víš, k čemu je použít. V tomto modulu se podíváš, jak je zapojit do učení a do každodenních úkolů, jak si říct o výstup v použitelné podobě a jak z opakované práce udělat jednoduchý pracovní postup.*

#### AI jako studijní parťák `#uceni`

Nejlepší studijní parťák ti nedá hotové řešení, ale pomůže ti pochopit látku. Tak používej i AI. Tady je pár osvědčených způsobů:

- **Vysvětli jinak:** „Vysvětli mi Pythagorovu větu na příkladu se žebříkem.“
- **Vyzkoušej mě:** „Polož mi pět otázek k Napoleonovi, po každé počkej na moji odpověď a ohodnoť ji.“
- **Plán opakování:** „Za týden píšu test ze tří kapitol. Navrhni mi plán na každý den po 20 minutách.“
- **Zkontroluj postup:** „Tady je můj postup řešení. Řekni mi, kde je chyba, ale neopravuj ji za mě.“

> **Test porozumění** (tip)
> Po práci s AI zavři okno a zkus látku vysvětlit vlastními slovy. Když to jde, učil ses ty, ne jen AI.

#### Výstup v použitelné podobě `#format`

Odpověď ve formě dlouhého odstavce se špatně používá. Když víš, co s výsledkem uděláš, řekni si o správný formát: číslovaný seznam pro postup, tabulku pro srovnání, krátké body na kartičky.

Modely často odpovídají v **Markdownu**: jednoduchém zápisu, kde `##` znamená nadpis, `-` odrážku a `**text**` tučné písmo. Pro programy se zase používá **JSON**, tedy data v přesně dané struktuře.

*[Ilustrace `markdown-json`]* Markdown je čitelný pro lidi, JSON pro programy.

**Zadání s formátem**

```
Porovnej tři druhy ovoce (jablko, banán, pomeranč) podle ceny, vitamínů a trvanlivosti. Výstup jako tabulku se třemi řádky a třemi sloupci, bez dalšího textu.
```

#### Text, obrázek, zvuk `#vstupy`

Moderní nástroje pracují nejen s textem. Umí popsat fotku, přečíst text z obrázku, přepsat nahrávku nebo vytáhnout údaje z tabulky. Takovým modelům se říká **multimodální**.

**Užitečné využití**

- přepsat poznámky z tabule z fotky (bez lidí na snímku),
- převést nahrávku přednášky na text a z něj udělat výpisky,
- nechat si vysvětlit graf nebo schéma z učebnice.

Platí stejná pravidla jako u textu: na obrázcích nesmí být lidé ani osobní údaje a výsledek je potřeba zkontrolovat.

#### Z opakované práce pracovní postup `#postup`

Když něco děláš pořád dokola stejně, můžeš to popsat jako **pracovní postup** (anglicky *workflow*). Každý postup má stejnou kostru: něco ho spustí, proběhne několik kroků a vznikne výstup.

*[Ilustrace `workflow`]* Spouštěč → akce → podmínka → výstup.

**Postup: týdenní plán úkolů**

```
Spouštěč: každou neděli večer.
Krok 1: vypíšu úkoly a testy na další týden.
Krok 2: požádám AI, ať je rozvrhne do dnů podle termínů.
Krok 3: plán zkontroluji a upravím podle kroužků.
Výstup: tabulka na lednici.
```

Postup nejdřív popiš na papíře. Teprve když funguje ručně, má smysl hledat nástroj, který ho zautomatizuje. Chyba v návrhu by se v automatu jen opakovala.

#### Kde rozhoduje člověk `#clovek`

Ne každý krok má udělat stroj. Kde jde o lidi, peníze nebo text, který uvidí ostatní, patří do postupu **kontrolní bod**: AI připraví návrh a člověk ho schválí, upraví nebo zamítne.

*[Ilustrace `human-loop`]* Model připraví návrh, člověk ho zkontroluje a teprve pak se odešle.

**Kontrolní bod nevynechávej**

- před odesláním zprávy učiteli, rodičům nebo zákazníkovi,
- u čehokoli, co hodnotí nebo se týká konkrétního člověka,
- když chybí data nebo je odpověď nejistá.

#### Poctivě přiznat pomoc `#poctivost`

Když ti AI s něčím pomohla, řekni to. Ve škole se řiď pravidly školy, v práci pravidly zaměstnavatele. Obecně stačí krátká poznámka, s čím ti nástroj pomohl a co jsi udělal sám.

**Poznámka k práci**

```
Osnovu a návrh otázek mi pomohl připravit AI nástroj. Fakta jsem ověřil v učebnici a na stránkách ČHMÚ. Text jsem napsal sám.
```

#### Shrnutí

- AI je dobrý studijní parťák, když vysvětluje, zkouší a kontroluje, ne když řeší za tebe.
- Řekni si o formát: seznam, tabulka, Markdown pro lidi, JSON pro programy.
- Pracovní postup má spouštěč, kroky a výstup. Nejdřív ho popiš ručně.
- Kde jde o lidi nebo důležité rozhodnutí, má poslední slovo člověk.

### Lekce 1: Plán na opakování (`kurz-m5-cv1`, 15 min)

Připrav si plán opakování na test nebo zkoušku. Nejdřív sám, pak případně s pomocí AI.

**Postup**

1. Vyber si test nebo zkoušku, která tě čeká (nebo si nějakou vymysli).
2. Sepiš témata a kolik máš dní a času denně.
3. Navrhni vlastní plán: co budeš který den opakovat.
4. Napiš zadání pro AI podle receptu z modulu 2 (role, kontext, úkol, podoba výstupu: tabulka po dnech).
5. Pokud smíš AI nástroj používat, porovnej jeho návrh se svým. Vezmi z obou to lepší.

> **Tip:** Přidej do plánu i den na zkoušení se nanečisto. AI tě může vyzkoušet, když jí napíšeš, ať se ptá po jedné otázce.

**Co si odneseš:** Plán opakování v tabulce po dnech a zadání, kterým bys ho od AI získal.

### Lekce 2: Správný formát (`kurz-m5-cv2`, 10 min)

Vyber pro každou situaci nejvhodnější podobu výstupu.

**Postup**

1. Přečti si situaci.
2. Vyber formát, který se nejlépe hodí.
3. Přečti si vysvětlení.

**Cvičení na stránce: QuizCard**

1. Chceš porovnat tři telefony podle ceny, baterie a fotoaparátu.
   - ▫️ Dlouhý odstavec textu.
   - ✅ Tabulka.
   - ▫️ Báseň.
   - *Vysvětlení:* Srovnání více věcí podle stejných vlastností je přesně úkol pro tabulku.

2. Potřebuješ postup, jak zasadit rajčata.
   - ✅ Číslovaný seznam kroků.
   - ▫️ Tabulka.
   - ▫️ Jedno slovo.
   - *Vysvětlení:* Postup má pořadí, proto číslovaný seznam.

3. Výstup bude číst program, který ho uloží do databáze.
   - ▫️ Markdown s nadpisy.
   - ✅ JSON se stanovenými poli.
   - ▫️ Volný text.
   - *Vysvětlení:* Program potřebuje přesnou strukturu, kterou umí přečíst: JSON.

4. Chceš kartičky na opakování slovíček.
   - ✅ Dvojice slovo a překlad, každá na řádku.
   - ▫️ Esej o angličtině.
   - ▫️ Graf.
   - *Vysvětlení:* Jednoduché dvojice se snadno převedou na kartičky.

**Co si odneseš:** Víš, jaký formát výstupu si říct pro jakou práci.

### Lekce 3: Navrhni pracovní postup (`kurz-m5-cv3`, 15 min)

Vyber si jednu činnost, kterou děláš pravidelně, a popiš ji jako pracovní postup.

**Postup**

1. Vyber činnost: třeba příprava týdenního plánu, třídění fotek z výletu, odpovídání na stejné dotazy v kroužku.
2. Zapiš spouštěč: co postup spustí (čas, nová zpráva, nový soubor).
3. Zapiš kroky: co se děje a kdo nebo co to dělá.
4. Zapiš výstup: co na konci vznikne.
5. Označ krok, kde může pomoct AI, a krok, kde musí rozhodnout člověk.
6. Zapiš, co se stane, když některý krok selže.

> **Tip:** Postup nakresli jako řadu krabiček se šipkami. Uvidíš, kde chybí krok nebo kde se může něco zaseknout.

**Co si odneseš:** Popis postupu: spouštěč, kroky, výstup, místo pro AI a kontrolní bod člověka.

### Lekce 4: Kdo má rozhodnout? (`kurz-m5-cv4`, 10 min)

U každého kroku rozhodni, jestli ho může udělat AI sama, nebo musí rozhodnout člověk.

**Postup**

1. Přečti si krok.
2. Vyber, kdo má rozhodovat.
3. Přečti si zpětnou vazbu.

**Cvičení na stránce: TrafficLightCards**

Tlačítka: zelená „AI to zvládne sama“, červená „Musí rozhodnout člověk“.

- Přepsat seznam úkolů do tabulky. → **AI to zvládne sama** (Mechanická práce bez rizika. Výsledek jen zkontroluješ očima.)
- Rozhodnout, kdo z přihlášených dostane poslední místo v kroužku. → **Musí rozhodnout člověk** (Rozhodnutí o konkrétním člověku patří lidem.)
- Navrhnout tři varianty textu pozvánky. → **AI to zvládne sama** (Návrhy jsou v pořádku, vybereš si ty.)
- Odeslat e-mail rodičům všech dětí ze třídy. → **Musí rozhodnout člověk** (Zprávu, kterou uvidí ostatní, musí před odesláním schválit člověk.)
- Seřadit fotky z výletu podle data. → **AI to zvládne sama** (Jednoduché třídění s jasným pravidlem.)
- Ohodnotit slohové práce spolužáků známkou. → **Musí rozhodnout člověk** (Hodnocení lidí musí dělat člověk. AI může nanejvýš upozornit na chyby.)

**Co si odneseš:** Víš, kam do postupu patří kontrolní bod člověka.

---

## Modul 6: Jak AI funguje uvnitř

*Kontext, nástroje, vlastní dokumenty a agenti* · 55 min · adresa `/edu/ai-gramotnost/kurz/m6`

**Cíle**

- Vysvětlíš, co je kontextové okno a proč model „zapomíná“.
- Popíšeš, jak model používá nástroje a vlastní dokumenty (RAG).
- Vysvětlíš, co je AI agent a proč potřebuje hranice.
- Víš, jak se kvalita AI systémů měří a jaká mají rizika.

### Teorie (`kurz-m6-teorie`)

*Na závěr kurzu nahlédneš pod kapotu. Nemusíš umět programovat. Stačí pochopit pár principů, díky kterým budeš rozumět novinkám, správně odhadneš, co AI systém zvládne, a poznáš, kde hrozí riziko.*

#### Kontextové okno: krátkodobá paměť `#kontext`

Model si mezi dvěma rozhovory nic nepamatuje. To, že v konverzaci „ví“, o čem jste mluvili, je dané tím, že aplikace mu s každou novou zprávou pošle znovu celou historii. Ta se ale vejde jen do **kontextového okna**: omezeného množství textu, které model najednou zpracuje.

*[Ilustrace `context-window`]* Každý požadavek posílá celou historii znovu. Když se okno naplní, staré zprávy se zkrátí nebo shrnou.

Proto v dlouhém rozhovoru model občas zapomene, co jsi chtěl na začátku. Pomůže začít novou konverzaci a vložit do ní krátké shrnutí toho důležitého.

#### Tokeny, rychlost a cena `#tokeny`

Model nepracuje se slovy, ale s **tokeny**, kousky textu. Česká slova se často rozpadají na víc tokenů než anglická. Podle počtu tokenů se měří, kolik textu se vejde do kontextového okna, jak dlouho odpověď trvá i kolik stojí: služby pro vývojáře účtují zvlášť tokeny, které modelu pošleš, a tokeny, které vrátí.

Proto se vyplatí psát zadání jasně a stručně a neposílat modelu zbytečně dlouhé texty.

#### Model a nástroje `#nastroje`

Model sám neumí zjistit dnešní počasí, spočítat přesně velký příklad ani podívat se do kalendáře. Moderní systémy mu proto dávají **nástroje**: model napíše, který nástroj chce použít a s jakými údaji, program nástroj spustí a výsledek vrátí modelu. Ten z něj pak napíše odpověď.

*[Ilustrace `function-calling`]* Model požádá o spuštění funkce, program ji spustí a vrátí výsledek. Model sám nic nespouští.

> **Proč je to důležité** (info)
> Odpověď postavená na výsledku nástroje (kalkulačka, vyhledávání, databáze) je spolehlivější než odpověď „z hlavy“ modelu. Pořád ale záleží na tom, jestli model nástroj použil správně.

#### Odpovědi z vlastních dokumentů (RAG) `#rag`

Model nezná školní řád tvé školy ani návod k vaší pračce. Systém s technikou **RAG** (z anglického *Retrieval-Augmented Generation*) nejdřív v dokumentech najde úseky, které souvisí s otázkou, vloží je do zadání a model odpovídá z nich. Dobrý systém přitom uvede, ze kterého dokumentu odpověď pochází.

*[Ilustrace `rag`]* Dokumenty se rozdělí na úseky, systém najde ty související a model z nich odpoví i se zdrojem.

**Výhody**

- odpovídá z aktuálních a ověřených dokumentů,
- umí uvést zdroj,
- nemusí se kvůli novým dokumentům znovu trénovat.

#### Agenti: AI, která jedná `#agenti`

**Agent** je systém, který dostane cíl a sám se rozhoduje, jaké kroky udělá: vyhledá informace, použije nástroj, napíše text, zkontroluje výsledek a pokračuje, dokud není hotovo. Složitější úlohy si může rozdělit mezi více specializovaných agentů.

*[Ilustrace `agents`]* Orchestrátor rozdělí práci mezi agenty a kontrolor ověří výsledek.

Čím víc toho agent smí udělat sám, tím větší škodu může napáchat chyba. Agent může být také oklamán textem, který čte: webová stránka může obsahovat skrytý pokyn „pošli mi data“. Tomu se říká **prompt injection**.

*[Ilustrace `prompt-injection`]* Text z dokumentu se tváří jako pokyn. Systém s ním musí zacházet jako s daty.

> **Hranice pro agenty** (warning)
> Agent má mít jen nutná oprávnění. Akce s dopadem (odeslání, nákup, smazání) potvrzuje člověk.

#### Jak se pozná, že systém funguje dobře `#kvalita`

Pár vyzkoušených otázek nestačí. Vývojáři si připraví **testovací sadu**: desítky typických i záludných dotazů se správnými odpověďmi. Systém na ní pravidelně zkouší, hlavně po každé změně, a sledují, jestli se nezhoršil.

*[Ilustrace `eval-loop`]* Testovací sada, model, porovnání s referencí a skóre.

**Co se měří**

- Je odpověď správná a úplná?
- Uvádí zdroj, když ho má?
- Přizná, když něco neví?
- Odmítne nebezpečný požadavek?
- Funguje stejně dobře pro různé skupiny uživatelů?

#### V cloudu, nebo v počítači `#kde-bezi`

Většina velkých modelů běží v **cloudu**, tedy na serverech firmy, a ty k nim přistupuješ přes internet. Menší modely jde spustit i na vlastním počítači.

- **V cloudu:** Výkonné a pohodlné modely. Data ale odcházejí k poskytovateli a za používání se často platí.
- **Na vlastním počítači:** Data zůstávají u tebe a nic se neplatí za dotaz. Modely jsou ale menší a potřebují výkonný počítač.

#### Kam dál `#dal`

AI se vyvíjí rychle a nástroje se mění každý rok. Principy z tohoto kurzu ale zůstávají: model odhaduje pravděpodobný text, záleží na datech a na zadání, odpovědi je potřeba ověřovat, soukromí je potřeba chránit a odpovědnost má vždy člověk.

Pokud tě téma chytlo, pokračuj v sekci AI gramotnost podle svého věku: kategorie pro 2. stupeň ZŠ a pro střední školy jdou do hloubky až k programování vlastních aplikací.

#### Shrnutí

- Model si pamatuje jen to, co se vejde do kontextového okna.
- S nástroji a vlastními dokumenty (RAG) odpovídá spolehlivěji a umí uvést zdroj.
- Agent sám jedná, a proto potřebuje omezená oprávnění a kontrolu člověka.
- Kvalita se měří na testovací sadě, ne podle dojmu z pár otázek.

### Lekce 1: Co si model pamatuje (`kurz-m6-cv1`, 10 min)

Ověř si, jak funguje kontextové okno a nástroje.

**Postup**

1. Odpověz na otázky.
2. Přečti si vysvětlení.
3. Zkus kamarádovi jednou větou vysvětlit, co je kontextové okno.

**Cvičení na stránce: QuizCard**

1. Začneš novou konverzaci. Pamatuje si model, o čem jste mluvili včera?
   - ▫️ Ano, vždycky.
   - ✅ Ne, pokud mu aplikace historii znovu nepošle.
   - ▫️ Jen důležité věci.
   - *Vysvětlení:* Model si nic nepamatuje. Paměť zajišťuje aplikace tím, že posílá historii.

2. Proč model v dlouhém rozhovoru zapomene pokyn ze začátku?
   - ▫️ Je unavený.
   - ✅ Historie se nevejde do kontextového okna a začátek se zkrátí nebo shrne.
   - ▫️ Pokyn smazal správce.
   - *Vysvětlení:* Kontextové okno má omezenou velikost.

3. Model má odpovědět, kolik je 48 731 × 2 917. Co je nejspolehlivější?
   - ▫️ Odhadne to z hlavy.
   - ✅ Použije nástroj kalkulačka a výsledek vloží do odpovědi.
   - ▫️ Zeptá se uživatele.
   - *Vysvětlení:* Na přesné výpočty má model použít nástroj.

4. Kdo spouští nástroj, o který model požádá?
   - ▫️ Model sám.
   - ✅ Program, který model obsluhuje.
   - ▫️ Uživatel ručně.
   - *Vysvětlení:* Model jen napíše požadavek. Spouští ho program.

**Co si odneseš:** Rozumíš tomu, proč model zapomíná a kdy používá nástroje.

### Lekce 2: AI s vlastní knihovnou (`kurz-m6-cv2`, 10 min)

Seřaď kroky systému RAG, který odpovídá na otázky ze školního řádu.

**Postup**

1. Přečti si karty s kroky.
2. Zařaď každý krok do správné fáze.
3. Zamysli se, kde může systém udělat chybu.

**Cvičení na stránce: CardSort**

- Školní řád se rozdělí na úseky. → **Příprava (jednou předem)**
- Ke každému úseku se uloží název kapitoly. → **Příprava (jednou předem)**
- Žák se zeptá: „Do kdy se musím omluvit?“ → **Při každém dotazu**
- Systém najde úseky, které s otázkou souvisejí. → **Při každém dotazu**
- Úseky se vloží do zadání pro model. → **Při každém dotazu**
- Model odpoví a uvede kapitolu řádu. → **Při každém dotazu**

**Co si odneseš:** Umíš popsat, jak systém hledá v dokumentech a proč umí uvést zdroj.

### Lekce 3: Agent na výletě (`kurz-m6-cv3`, 15 min)

Navrhni, co smí AI agent sám a co musí potvrdit člověk, když plánuje školní výlet.

**Postup**

1. Agent má cíl: naplánovat jednodenní výlet třídy do 100 km od školy s rozpočtem 500 Kč na žáka.
2. Vypiš kroky, které agent udělá (hledání míst, porovnání cen, návrh programu, rezervace, informace rodičům…).
3. U každého kroku rozhodni: smí ho udělat sám, nebo jen připraví návrh pro člověka?
4. Napiš, jaká oprávnění agent potřebuje a jaká mít nesmí (například platit kartou).
5. Doplň jedno riziko: co se stane, když agent narazí na stránku se skrytým pokynem?

> **Tip:** Dobré pravidlo: agent smí hledat, porovnávat a navrhovat. Co stojí peníze nebo odchází k jiným lidem, potvrzuje člověk.

**Co si odneseš:** Tabulka kroků s rozdělením agent / člověk a seznam oprávnění.

### Lekce 4: Závěrečný test kurzu (`kurz-m6-cv4`, 15 min)

Otázky ze všech šesti modulů. Ověř si, co sis z kurzu odnesl.

**Postup**

1. Odpověz na všechny otázky.
2. Přečti si vysvětlení u každé odpovědi.
3. Pokud ti někde nejde, vrať se k teorii příslušného modulu.

**Cvičení na stránce: QuizCard**

1. Co je umělá inteligence?
   - ▫️ Živá bytost v počítači.
   - ✅ Program, který se naučil z mnoha příkladů.
   - ▫️ Robot, který mluví.
   - *Vysvětlení:* Modul 1: AI se učí z příkladů místo pevných pravidel.

2. Proč odpověď konverzačního nástroje zní přesvědčivě, i když je chybná?
   - ▫️ Model ví, že má pravdu.
   - ✅ Model vybírá pravděpodobná slova, ne ověřená fakta.
   - ▫️ Někdo ji předem zkontroloval.
   - *Vysvětlení:* Moduly 1 a 3: pravděpodobné neznamená pravdivé.

3. Které čtyři části má dobré zadání?
   - ✅ Role, kontext, úkol, podoba výstupu.
   - ▫️ Jméno, adresa, věk, škola.
   - ▫️ Úvod, stať, závěr, podpis.
   - *Vysvětlení:* Modul 2: recept na zadání.

4. Model doporučil knihu s konkrétním autorem. Co uděláš?
   - ▫️ Rovnou ji ocituju.
   - ✅ Ověřím v knihovně nebo katalogu, že existuje.
   - ▫️ Nic, AI se nemýlí.
   - *Vysvětlení:* Modul 3: názvy knih a autoři patří k častým halucinacím.

5. Co do AI nástroje nepatří?
   - ▫️ Otázka k učivu.
   - ✅ Heslo a údaje o spolužácích.
   - ▫️ Vlastní text bez jmen.
   - *Vysvětlení:* Modul 4: hesla a údaje o druhých nikdy.

6. Jak dostaneš srovnání tří věcí v přehledné podobě?
   - ✅ Napíšu, že chci tabulku.
   - ▫️ Doufám, že to AI pozná.
   - ▫️ Zeptám se třikrát.
   - *Vysvětlení:* Modul 5: o formát si řekni.

7. Kdo má rozhodnout o tom, kdo dostane místo v kroužku?
   - ▫️ AI.
   - ✅ Člověk.
   - ▫️ Los.
   - *Vysvětlení:* Modul 5: rozhodnutí o lidech patří lidem.

8. Co je prompt injection?
   - ▫️ Rychlé psaní promptů.
   - ✅ Skrytý pokyn v datech, který se snaží agenta oklamat.
   - ▫️ Oprava překlepů.
   - *Vysvětlení:* Modul 6: data nejsou pokyny. Agent potřebuje hranice.

**Co si odneseš:** Zopakoval sis celý kurz a víš, ke kterým tématům se vrátit.
