-- Základy programování + Terminál & Bash — Kompletní kurzy
-- MariaDB 10.4, phpMyAdmin style, no DELIMITER
-- Apostrofy escapovány jako ''

-- ============================================================
-- KURZ 1: Základy programování
-- ============================================================

SET @zp = (SELECT id FROM courses WHERE slug = 'zaklady-programovani');

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@zp, 'Co je programování + algoritmus', '<h2>Co je programování</h2><p>Programování je proces vytváření instrukcí, které počítač dokáže vykonat. Program je posloupnost kroků — algoritmus — který řeší konkrétní problém.</p><h2>Algoritmus</h2><p>Algoritmus je přesně definovaný postup s konečným počtem kroků, který pro daný vstup vždy dá stejný výstup.</p><pre><code>// Algoritmus: Najdi větší ze dvou čísel
FUNKCE vetsi(a, b):
    POKUD a > b:
        VRAT a
    JINAK:
        VRAT b</code></pre><h2>Vlastnosti algoritmu</h2><ul><li><strong>Konečnost</strong> — musí skončit</li><li><strong>Determinismus</strong> — stejný vstup = stejný výstup</li><li><strong>Obecnost</strong> — funguje pro sadu vstupů</li><li><strong>Správnost</strong> — dává správný výsledek</li></ul>', 'lesson', 1, 10, 10),

(@zp, 'Binární soustava + jak počítač myslí', '<h2>Binární soustava</h2><p>Počítač pracuje pouze se dvěma stavy: 0 a 1 (vypnuto/zapnuto). Vše — čísla, texty, obrázky — je reprezentováno jako posloupnost bitů.</p><pre><code>Desítková → Binární
0  → 0000
1  → 0001
2  → 0010
5  → 0101
10 → 1010
255 → 11111111</code></pre><h2>Jak počítač myslí</h2><p>CPU čte instrukce z paměti (RAM), provede je a zapíše výsledky. Cyklus: <strong>fetch → decode → execute</strong>. Paměť je pole buněk, každá s adresou. 1 bajt = 8 bitů, 1 KB = 1024 bajtů.</p><pre><code>Bit:      0 nebo 1
Bajt:     8 bitů (0–255)
Kilobajt: 1024 bajtů
Megabajt: 1024 KB
Gigabajt: 1024 MB</code></pre>', 'lesson', 2, 10, 10),

(@zp, 'Proměnné a datové typy', '<h2>Proměnné</h2><p>Proměnná je pojmenované místo v paměti, které uchovává hodnotu. Jako krabice se štítkem — do krabice dáš hodnotu, na štítek napíšeš jméno.</p><pre><code>jmeno = "Karel"     // text (string)
vek = 25             // celé číslo (integer)
prumer = 4.8         // desetinné číslo (float)
aktivni = true       // pravda/nepravda (boolean)</code></pre><h2>Datové typy</h2><ul><li><strong>Integer (int)</strong> — celá čísla: -5, 0, 42</li><li><strong>Float</strong> — desetinná čísla: 3.14, -0.5</li><li><strong>String (str)</strong> — text: "ahoj", "VeVit"</li><li><strong>Boolean (bool)</strong> — true/false</li><li><strong>Null/None</strong> — prázdná hodnota</li></ul><p>Dynamické typování: typ se určuje za běhu. Statické typování: typ se určuje při psaní (Java, C++, TypeScript).</p>', 'lesson', 3, 10, 10),

(@zp, 'Operátory a výrazy', '<h2>Aritmetické operátory</h2><pre><code>+   sčítání        5 + 3 = 8
-   odčítání       10 - 4 = 6
*   násobení       3 * 7 = 21
/   dělení         15 / 4 = 3.75
//  celočíselné     15 // 4 = 3
%   modulo (zbytek) 15 % 4 = 3
**  mocnina         2 ** 8 = 256</code></pre><h2>Porovnávací operátory</h2><pre><code>==  rovná se       5 == 5 → true
!=  nerovná se     5 != 3 → true
<   menší           3 < 5 → true
>   větší           5 > 3 → true
<=  menší nebo rovno
>=  větší nebo rovno</code></pre><h2>Logické operátory</h2><pre><code>A  (AND)  obě podmínky musí být true
NEBO (OR)  alespoň jedna true
NE (NOT)  negace</code></pre>', 'lesson', 4, 10, 10),

(@zp, 'Podmínky (if/else/switch)', '<h2>Podmíněné provedení</h2><p>Program se rozhodne, kterou větev kódu provede, na základě podmínky.</p><pre><code>POKUD vek >= 18:
    VYPIŠ "Dospělý"
JINAK POKUD vek >= 15:
    VYPIŠ "Střední škola"
JINAK:
    VYPIŠ "Základní škola"</code></pre><h2>Switch (více variant)</h2><pre><code>PODLE den:
    "po": VYPIŠ "Pracovní den"
    "út": VYPIŠ "Pracovní den"
    "so": VYPIŠ "Víkend"
    "ne": VYPIŠ "Víkend"
    JINAK: VYPIŠ "Neznámý"</code></pre><h2>Ternární operátor</h2><pre><code>vysledek = PAK hodnota_a POKUD podmínka JINAK hodnota_b
status = "dospely" POKUD vek >= 18 JINAK "neplnolety"</code></pre>', 'lesson', 5, 10, 12),

(@zp, 'Cykly (for/while/do-while)', '<h2>Cyklus while</h2><p>Opakuje blok, dokud je podmínka true. Pozor na nekonečné cykly!</p><pre><code>i = 0
DOKUD i < 5:
    VYPIŠ i
    i = i + 1
// Vypíše: 0 1 2 3 4</code></pre><h2>Cyklus for</h2><pre><code>PRO i OD 0 DO 4:
    VYPIŠ i
// Vypíše: 0 1 2 3 4

PRO kazdy_prvek V seznamu:
    VYPIŠ kazdy_prvek</code></pre><h2>Do-while</h2><p>Provede tělo alespoň jednou, pak testuje podmínku.</p><pre><code>OPAKUJ:
    vstup = PRECTI_VSTUP()
DOKUD vstup != "konec"</code></pre><h2>break a continue</h2><p><code>break</code> ukončí cyklus, <code>continue</code> přeskočí aktuální iteraci.</p>', 'lesson', 6, 10, 12),

(@zp, 'Funkce a procedury', '<h2>Funkce</h2><p>Pojmenovaný blok kódu, který přijímá vstupy (parametry) a vrací výsledek.</p><pre><code>FUNKCE pozdrav(jmeno):
    VRAT "Ahoj, " + jmeno + "!"

vysledek = pozdrav("Karel")  // "Ahoj, Karel!"</code></pre><h2>Procedura</h2><p>Podobná funkci, ale nevrací hodnotu — jen provede akci.</p><pre><code>PROCEDURA vypis_menu():
    VYPIŠ "1. Nová hra"
    VYPIŠ "2. Nastavení"
    VYPIŠ "3. Konec"</code></pre><h2>Proč používat funkce</h2><ul><li><strong>Opakované použití</strong> — napiš jednou, zavolej víckrát</li><li><strong>Čitelnost</strong> — kód má jméno</li><li><strong>Testování</strong> — testuj malý kus, ne celý program</li></ul>', 'lesson', 7, 10, 10),

(@zp, 'Rekurze', '<h2>Rekurze</h2><p>Funkce volá sama sebe. Musí mít <strong>základní případ</strong> (kdy skončit), jinak nastane nekonečná rekurse → chyba.</p><pre><code>FUNKCE faktorial(n):
    POKUD n <= 1:
        VRAT 1                    // základní případ
    VRAT n * faktorial(n - 1)    // rekurzivní krok

faktorial(5)  // 5 * 4 * 3 * 2 * 1 = 120</code></pre><h2>Fibonacciho posloupnost</h2><pre><code>FUNKCE fibonacci(n):
    POKUD n <= 1:
        VRAT n
    VRAT fibonacci(n-1) + fibonacci(n-2)

fibonacci(6)  // 0,1,1,2,3,5,8 → 8</code></pre><p>Pozor: naivní rekurze Fibonacci je exponenciální — O(2^n). V praxi použij memoizaci nebo iterativní řešení.</p>', 'lesson', 8, 10, 13),

(@zp, 'Pole a kolekce', '<h2>Pole (array)</h2><p>Uspořádaná kolekce prvků s indexem od 0.</p><pre><code>ovoce = ["jablko", "banán", "hruška"]
ovoce[0]       // "jablko"
ovoce[2]       // "hruška"
ovoce.DELKA    // 3

// Přidání a odebrání
ovoce.PŘIDEJ("třešeň")
ovoce.ODEBER_POSLEDNÍ()</code></pre><h2>Operace s poli</h2><pre><code>hledané = ovoce.NAJDI("banán")     // index 1
filtr = čísla.VYBER(x => x > 5)     // pouze > 5
mapa = čísla.PŘEVEĎ(x => x * 2)     // dvojnásobek
součet = čísla.REDUKUJ((a, b) => a + b)</code></pre><h2>Dvourozměrné pole (matice)</h2><pre><code>matice = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
matice[1][2]  // 6</code></pre>', 'lesson', 9, 10, 12),

(@zp, 'Slovníky/hash mapy', '<h2>Slovník (dictionary / hash map)</h2><p>Kolekce klíč–hodnota. Klíč je unikátní, hodnota může být cokoliv. Přístup O(1).</p><pre><code>student = {
    "jmeno": "Karel",
    "vek": 20,
    "kurz": "Python"
}

student["jmeno"]           // "Karel"
student["vek"]             // 20
student["prumer"] = 4.5    // přidání nového klíče

// Kontrola existence
POKUD "jmeno" VE student:
    VYPIŠ(student["jmeno"])</code></pre><h2>Hash funkce</h2><p>Slovník funguje díky hash funkci — převede klíč na číslo (index v poli). Kolize: dva klíče dají stejný hash → řeší se chaining nebo open addressing.</p><pre><code>// Zákulisí slovníku
hash("jmeno") → 42 → pole[42] → { "jmeno": "Karel" }</code></pre>', 'lesson', 10, 10, 12),

(@zp, 'Vstup a výstup (I/O)', '<h2>Vstup od uživatele</h2><pre><code>jmeno = PRECTI_VSTUP("Zadej jméno: ")
vek = PRECTI_CISLO("Zadej věk: ")
VYPIŠ(f"Ahoj, {jmeno}! Je ti {vek} let.")</code></pre><h2>Výstup</h2><pre><code>VYPIŠ("Text na obrazovku")          // standardní výstup
VYPIŠ_CHYBU("Chyba: špatný vstup")   // error výstup</code></pre><h2>Práce se soubory</h2><pre><code>// Čtení
soubor = OTEVRI("data.txt", "čtení")
obsah = soubor.PRECTI_VSE()
ZAVRI(soubor)

// Zápis
soubor = OTEVRI("vystup.txt", "zápis")
soubor.NAPIŠ("Ahoj, světe!")
ZAVRI(soubor)

// Bezpečnější: automatické zavření
S SOUBOREM("data.txt") JAKO s:
    obsah = s.PRECTI_VSE()</code></pre>', 'lesson', 11, 10, 12),

(@zp, 'Debugging — typy chyb a techniky', '<h2>Typy chyb</h2><ul><li><strong>Syntax error</strong> — překlep v kódu, chybějící závorka</li><li><strong>Runtime error</strong> — chyba za běhu (dělení nulou, null pointer)</li><li><strong>Logic error</strong> — program běží, ale dává špatný výsledek</li></ul><pre><code>// Syntax error — chybí uvozovka
VYPIŠ("ahoj)

// Runtime error — dělení nulou
vysledek = 10 / 0

// Logic error — špatná podmínka
POKUD vek > 18:  // mělo by >=
    VYPIŠ("Dospělý")</code></pre><h2>Techniky ladění</h2><ul><li><strong>Print debugging</strong> — vypiš proměnné v kritických bodech</li><li><strong>Debugger</strong> — krokování, breakpointy, sledování proměnných</li><li><strong>Rubber duck</strong> — vysvětli kód nahlas, problém se odhalí sám</li><li><strong>Binary search</strong> — zúži problém půlením kódu</li></ul>', 'lesson', 12, 10, 12),

(@zp, 'Datové struktury — přehled', '<h2>Základní datové struktury</h2><p><strong>Stack (zásobník)</strong> — LIFO (Last In, First Out). Jako nádoba na talíře.</p><pre><code>zásobník.PŘIDEJ("a")  // push
zásobník.PŘIDEJ("b")
zásobník.VEM()        // pop → "b"</code></pre><p><strong>Queue (fronta)</strong> — FIFO (First In, First Out). Jako fronta v obchodě.</p><pre><code>fronta.ZAŘAĎ("a")    // enqueue
fronta.ZAŘAĎ("b")
fronta.VYŘAĎ()       // dequeue → "a"</code></pre><p><strong>Tree (strom)</strong> — hierarchická struktura. Root, nodes, leaves. Binární strom: každý uzel max 2 děti.</p><p><strong>Graph (graf)</strong> — uzly a hrany. Directed/undirected, weighted. Reprezentace: adjacency matrix nebo adjacency list.</p><pre><code>// Strom: souborový systém
root/
├── dokumenty/
│   └── prace.txt
└── obrazky/
    └── dovolena.jpg</code></pre>', 'lesson', 13, 10, 15),

(@zp, 'Big O notace — časová složitost', '<h2>Big O</h2><p>Měří, jak roste čas výpočtu s rostoucími vstupy. Nehodnotí přesný čas — ale trendy.</p><pre><code>O(1)     — konstantní    // přístup k poli: arr[5]
O(log n) — logaritmická  // binární vyhledávání
O(n)     — lineární      // průchod polem
O(n log n) — quasi-linear // merge sort, quick sort
O(n²)    — kvadratická    // dva vnořené cykly
O(2^n)   — exponenciální  // naivní Fibonacci rekurze</code></pre><h2>Příklady</h2><pre><code>// O(1) — přístup podle indexu
prvek = pole[42]

// O(n) — hledání v neseřazeném poli
PRO kazdy V pole:
    POKUD kazdy == hledany:
        VRAT kazdy

// O(n²) — bubble sort
PRO i OD 0 DO n:
    PRO j OD 0 DO n:
        POKUD pole[j] > pole[j+1]:
            PROHOD(pole[j], pole[j+1])</code></pre>', 'lesson', 14, 10, 15),

(@zp, 'OOP — třídy, objekty, 4 pilíře', '<h2>Třída a objekt</h2><p>Třída = předpis (plán). Objekt = konkrétní instance.</p><pre><code>TŘÍDA Zvíře:
    druh = "neznámý"

    KONSTRUKTOR(jméno):
        toto.jméno = jméno

    METODA zvuk():
        VRAT "..."

pes = NOVÉ Zvíře("Rex")
pes.jméno   // "Rex"</code></pre><h2>4 pilíře OOP</h2><ul><li><strong>Encapsulace</strong> — skryj vnitřnosti,暴露 bezpečné rozhraní</li><li><strong>Dědičnost</strong> — třída dědí vlastnosti rodiče</li><li><strong>Polymorfismus</strong> — stejná metoda, jiné chování v podtřídě</li><li><strong>Abstrakce</strong> — skryj nepodstatné, ukaž podstatné</li></ul><pre><code>TŘÍDA Pes DĚDÍ Zvíře:
    METODA zvuk():
        VRAT "Haf!"</code></pre>', 'lesson', 15, 10, 15),

(@zp, 'Funkcionální programování — základy', '<h2>FP principy</h2><ul><li><strong>Čisté funkce</strong> — same input → same output, žádné side effects</li><li><strong>Neměnnost (immutability)</strong> — data se nemění, vytváříš nové</li><li><strong>Funkce jako hodnoty</strong> — předávej funkce jako parametry</li><li><strong>Declarativní styl</strong> — CO, ne JAK</li></ul><pre><code>// Imperativní — JAK
výsledek = []
PRO i OD 0 DO pole.DELKA:
    POKUD pole[i] > 5:
        výsledek.PŘIDEJ(pole[i])

// Funkcionální — CO
výsledek = pole.VYBER(x => x > 5)</code></pre><h2>Compose a pipe</h2><pre><code>PIPE(
    oříznout_mezery,
    na_malá_písmena,
    první_velké
)("  kaREL  ")  // "Karel"</code></pre>', 'lesson', 16, 10, 12),

(@zp, 'Git a verzování — úvod', '<h2>Co je Git</h2><p>Git je distribuovaný verzovací systém — sleduje změny v kódu, umožňuje návrat k libovolné verzi, spolupráci.</p><pre><code>git init              // nový repozitář
git add soubor.js     // přidej do stage
git commit -m "zpráva" // ulož snapshot
git push              // odešli na server
git pull              // stáhni změny</code></pre><h2>Workflow</h2><pre><code>1. Uprav soubory
2. git add .              // stage všechny změny
3. git commit -m "popis"  // commit
4. git push               // push na GitHub</code></pre><h2>Klíčové koncepty</h2><ul><li><strong>Commit</strong> — snapshot kódu v čase</li><li><strong>Branch</strong> — paralelní větev vývoje</li><li><strong>Merge</strong> — sloučení větví</li><li><strong>Clone</strong> — kopie vzdáleného repozitáře</li></ul>', 'lesson', 17, 10, 12),

(@zp, 'Internet a jak funguje web', '<h2>Jak funguje internet</h2><ol><li>Zadáš URL do prohlížeče</li><li>DNS přeloží doménu na IP adresu</li><li>Prohlížeč vyšle HTTP požadavek na server</li><li>Server odpoví HTML, CSS, JS</li><li>Prohlížeč vykreslí stránku</li></ol><pre><code>URL: https://edu.vevit.fun/kurzy
  ↓
DNS: edu.vevit.fun → 93.185.104.xxx
  ↓
HTTP: GET /kurzy → Server
  ↓
Response: HTML + CSS + JS
  ↓
Browser: render → uživatel vidí stránku</code></pre><h2>Protokoly</h2><ul><li><strong>HTTP/HTTPS</strong> — přenos webu (GET, POST, PUT, DELETE)</li><li><strong>TCP</strong> — spolehlivé doručení paketů</li><li><strong>DNS</strong> — překlad domén na IP</li><li><strong>WebSocket</strong> — obousměrná real-time komunikace</li></ul>', 'lesson', 18, 10, 12),

(@zp, 'Databáze — základní pojmy', '<h2>Co je databáze</h2><p>Organizovaná kolekce dat. Relační DB (SQL) ukládá data do tabulek s řádky a sloupci.</p><pre><code>Tabulka: users
+----+--------+-----+
| id | jmeno  | xp  |
+----+--------+-----+
|  1 | Karel  | 250 |
|  2 | Jana   | 180 |
+----+--------+-----+</code></pre><h2>Základní operace (CRUD)</h2><pre><code>// Create
INSERT INTO users (jmeno, xp) VALUES ("Petr", 100)

// Read
SELECT * FROM users WHERE xp > 150

// Update
UPDATE users SET xp = 300 WHERE id = 1

// Delete
DELETE FROM users WHERE id = 2</code></pre><h2>SQL vs NoSQL</h2><ul><li><strong>SQL</strong> (MySQL, PostgreSQL) — tabulky, schema, JOIN, transakce</li><li><strong>NoSQL</strong> (MongoDB, Redis) — dokumenty, klíč–hodnota, flexibilní schema</li></ul>', 'lesson', 19, 10, 12),

(@zp, 'Bezpečnost + výběr jazyka — roadmapa', '<h2>Bezpečnost</h2><ul><li><strong>XSS</strong> — nikdy nevkládej uživatelský vstup přes innerHTML</li><li><strong>SQL injection</strong> — vždy používej prepared statements</li><li><strong>HTTPS</strong> — šifruj komunikaci</li><li><strong>Hesla</strong> — hashuj (bcrypt, ne MD5!)</li><li><strong>Validace</strong> — ověř vstup na serveru</li></ul><h2>Výběr jazyka</h2><table><tr><th>Jazyk</th><th>Vhodné pro</th></tr><tr><td>Python</td><td>Začátečníci, AI/ML, backend, skripty</td></tr><tr><td>JavaScript</td><td>Web frontend + backend, mobilní aplikace</td></tr><tr><td>TypeScript</td><td>Větší JS projekty, enterprise</td></tr><tr><td>Java/C#</td><td>Enterprise, Android, herní vývoj</td></tr><tr><td>C/C++</td><td>Systémové programování, výkon</td></tr><tr><td>Rust</td><td>Bezpečné systémové programování</td></tr><tr><td>Go</td><td>Cloud, microservices, DevOps</td></tr></table><h2>Roadmapa</h2><ol><li>Základy (tento kurz) → Python nebo JS</li><li>Pokročilé koncepty → OOP, algoritmy</li><li>Framework → Django/Flask nebo React/Node</li><li>Projekty → portfolio na GitHub</li></ol>', 'lesson', 20, 10, 15);


-- ============================================================
-- ZÁVĚREČNÝ KVÍZ: Základy programování (sort_order 21)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@zp, 'Závěrečný kvíz — Základy programování', '<p>Závěrečný test pokrývající všechny koncepty kurzu.</p>', 'final_quiz', 21, 100, 20);

SET @qfin_zp = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@qfin_zp, 'Co je algoritmus?', 'Programovací jazyk', 'Přesně definovaný postup řešení problému', 'Typ proměnné', 'Databázový dotaz', 'b', 'Algoritmus je přesně definovaný postup s konečným počtem kroků, který pro daný vstup vždy dá stejný výstup.', 1),
(@qfin_zp, 'Jaká je hodnota 10 % 3?', '3', '3.33', '1', '0', 'c', 'Modulo (%) vrací zbytek po dělení. 10 / 3 = 3 zbytek 1, tedy 10 % 3 = 1.', 2),
(@qfin_zp, 'Co je O(n) v Big O notaci?', 'Konstantní složitost', 'Lineární složitost', 'Kvadratická složitost', 'Logaritmická složitost', 'b', 'O(n) = lineární složitost — čas roste úměrně s velikostí vstupu (např. průchod polem).', 3),
(@qfin_zp, 'Která struktura je LIFO?', 'Fronta (queue)', 'Zásobník (stack)', 'Seznam (list)', 'Slovník (dict)', 'b', 'Stack (zásobník) je LIFO — Last In, First Out. Jako nádoba na talíře: poslední vložený je první vybraný.', 4),
(@qfin_zp, 'Co je encapsulace v OOP?', 'Dědičnost vlastností', 'Skrytí vnitřností a vystavení bezpečného rozhraní', 'Volání funkce sama sebe', 'Převod typů', 'b', 'Encapsulace = skrytí vnitřní implementace objektu a poskytnutí pouze veřejného rozhraní (public API).', 5),
(@qfin_zp, 'Co vrací rekurzivní funkce bez základního případu?', 'Null', 'Chyba přetečení zásobníku (stack overflow)', 'Prázdný výsledek', 'True', 'b', 'Bez základního případu rekurze nikdy neskončí — vyčerpá zásobník volání a způsobí Stack Overflow.', 6),
(@qfin_zp, 'Co je čistá funkce (pure function)?', 'Funkce bez parametrů', 'Funkce, která vždy dá stejný výstup pro stejný vstup bez side efektů', 'Funkce, která nic nevrací', 'Privátní metoda', 'b', 'Pure function = deterministická (same input → same output) a bez side efektů (nemění externí stav).', 7),
(@qfin_zp, 'Co dělá git commit?', 'Odešle kód na server', 'Uloží snapshot aktuálních změn', 'Smaže historii', 'Vytvoří novou větev', 'b', 'git commit uloží snapshot změněných souborů z stage do lokální historie. Push odešle na server.', 8),
(@qfin_zp, 'Co překládá DNS?', 'IP adresu na URL', 'Doménové jméno na IP adresu', 'HTML na CSS', 'Port na protokol', 'b', 'DNS (Domain Name System) překládá doménová jména (edu.vevit.fun) na IP adresy (93.185.104.xxx).', 9),
(@qfin_zp, 'Co je SQL injection?', 'Chyba v SQL syntaxi', 'Útok vložením SQL kódu přes neošetřený vstup', 'Typ databáze', 'Optimalizace dotazů', 'b', 'SQL injection = útočník vloží SQL kód přes uživatelský vstup. Prevence: prepared statements a validace.', 10);


UPDATE courses SET lesson_count = (SELECT COUNT(*) FROM lessons WHERE course_id = @zp) WHERE id = @zp;


-- ============================================================
-- KURZ 2: Terminál & Bash
-- ============================================================

SET @term = (SELECT id FROM courses WHERE slug = 'terminal');

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@term, 'Co je terminál, shell, Bash', '<h2>Terminál vs Shell</h2><p><strong>Terminál</strong> — aplikace, která zobrazuje příkazovou řádku. <strong>Shell</strong> — program, který zpracovává příkazy (Bash, Zsh, Fish). <strong>Bash</strong> — nejrozšířenější shell (Bourne Again SHell).</p><pre><code># Otevři terminál
# Na Mac: Cmd+Space → Terminal
# Na Windows: Windows Terminal / Git Bash / WSL

# Jaký shell běží?
echo $SHELL    # /bin/bash

# Verze Bash
bash --version</code></pre><h2>Prompt</h2><pre><code>karel@vevit:~$ _         # uživatel@stroj:adresář$
# $ = běžný uživatel, # = root</code></pre>', 'lesson', 1, 10, 10),

(@term, 'Navigace (pwd, ls, cd)', '<h2>Kde jsem?</h2><pre><code>pwd              # print working directory — aktuální složka
# /home/karel</code></pre><h2>Co je tady?</h2><pre><code>ls               # seznam souborů
ls -la           # detailní výpis (skryté, práva, velikost)
ls -lh           # velikost v KB/MB</code></pre><h2>Pohyb</h2><pre><code>cd Dokumenty     # vstoupit do složky
cd ..            # o úroveň výš
cd ~             # domovská složka
cd /             # kořenový adresář
cd -             # zpět na předchozí složku</code></pre><h2>Cesty</h2><pre><code>/home/karel/     # absolutní (od kořene)
Dokumenty/       # relativní (od aktuální složky)
~/Dokumenty/     # zkratka pro domovskou složku</code></pre>', 'lesson', 2, 10, 10),

(@term, 'Soubory a složky (mkdir, touch, cp, mv, rm, cat, less)', '<h2>Vytvoření</h2><pre><code>mkdir projekt          # nová složka
mkdir -p a/b/c         # vnořené složky najednou
touch index.html       # nový prázdný soubor
touch app.js style.css # více souborů</code></pre><h2>Kopírování a přesun</h2><pre><code>cp app.js app_backup.js    # kopie
cp -r slozka/ slozka_bak/  # kopie složky (-r = recursive)
mv old.js new.js           # přejmenování/přesun
mv soubor.txt Dokumenty/   # přesun do složky</code></pre><h2>Mazání</h2><pre><code>rm soubor.txt          # smazat soubor (nepromítne se do koše!)
rm -r slozka/          # smazat složku i obsahem
rm -rf slozka/         # force — bez potvrzení (pozor!)</code></pre><h2>Čtení</h2><pre><code>cat soubor.txt        # výpis celého souboru
less soubor.txt       # prohlížení (q=konec, /, hledání)
head -n 20 soubor.txt # prvních 20 řádků
tail -n 20 soubor.txt # posledních 20 řádků</code></pre>', 'lesson', 3, 10, 12),

(@term, 'Přesměrování a pipes (>, >>, |, grep)', '<h2>Přesměrování výstupu</h2><pre><code>echo "Ahoj" > soubor.txt     # zapiš (přepíše)
echo "Světe" >> soubor.txt   # přidej na konec
ls -la > listing.txt          # ulož výpis</code></pre><h2>Pipes (roury)</h2><pre><code># Výstup jednoho příkazu → vstup dalšího
cat log.txt | grep "error"
ls -la | grep ".js" | wc -l    # počet JS souborů
ps aux | grep "node"</code></pre><h2>grep — hledání v textu</h2><pre><code>grep "TODO" app.js            # hledej řádky s TODO
grep -i "error" log.txt        # ignoruj velikost
grep -r "fetch" src/            # rekurzivně ve složce
grep -n "function" app.js      # ukaž čísla řádků
grep -c "import" *.js           # počet výskytů</code></pre>', 'lesson', 4, 10, 12),

(@term, 'Proměnné prostředí + .bashrc/.zshrc + aliasy', '<h2>Proměnné</h2><pre><code># Čtení
echo $HOME        # /home/karel
echo $PATH        # cesty k programům
echo $USER        # karel

# Nastavení (jen pro aktuální session)
export VEVIT_API="https://api.vevit.fun"
echo $VEVIT_API</code></pre><h2>Trvalé nastavení — .bashrc</h2><pre><code># Otevři konfiguraci
nano ~/.bashrc

# Přidej na konec:
export VEVIT_ENV="production"
export PATH="$PATH:/home/karel/bin"

# Aliasy — zkratky
alias ll="ls -la"
alias gs="git status"
alias gp="git push"
alias dc="docker-compose"
alias v="vim"

# Ulož a načti
source ~/.bashrc</code></pre>', 'lesson', 5, 10, 12),

(@term, 'Procesy (ps, kill, top, &, jobs, fg)', '<h2>Správa procesů</h2><pre><code>ps aux             # seznam všech procesů
ps aux | grep node  # najdi Node.js proces
top                 # interaktivní monitor (q=quit)
htop                # lepší top (instaluj: apt install htop)</code></pre><h2>Ukončení procesu</h2><pre><code>kill 12345         # ukonči proces (SIGTERM)
kill -9 12345       # vynuť ukončení (SIGKILL)
killall node        # ukonči všechny procesy "node"</code></pre><h2>Pozadí a popředí</h2><pre><code>node server.js &   # spusť na pozadí
jobs               # seznam jobů v pozadí
fg %1              # přenes job 1 do popředí
Ctrl+Z             # pozastav proces
bg %1              # spusť pozastavený na pozadí</code></pre>', 'lesson', 6, 10, 12),

(@term, 'SSH — připojení k serveru, klíče, SCP', '<h2>Připojení</h2><pre><code>ssh user@server.vevit.fun       # připojení
ssh -p 2222 user@server          # vlastní port
ssh -i ~/.ssh/id_rsa user@server # s klíčem</code></pre><h2>SSH klíče</h2><pre><code># Vygeneruj klíč
ssh-keygen -t ed25519 -C "karel@vevit.fun"

# Zkopíruj veřejný klíč na server
ssh-copy-id user@server.vevit.fun

# Poté se připojuj bez hesla!
ssh user@server.vevit.fun</code></pre><h2>SCP — přenos souborů</h2><pre><code>scp soubor.txt user@server:/home/user/     # nahoru
scp user@server:/var/log/error.log ./       # dolů
scp -r slozka/ user@server:/tmp/            # rekurzivně</code></pre>', 'lesson', 7, 10, 15),

(@term, 'Bash skripty — základy (if, for, while, funkce)', '<h2>První skript</h2><pre><code>#!/bin/bash
# deploy.sh — VeVit deployment

echo "Starting deploy..."
cd /var/www/edu.vevit.fun
git pull origin main
npm install
npm run build
echo "Deploy complete!"</code></pre><h2>Podmínky a cykly</h2><pre><code>#!/bin/bash
if [ -f "package.json" ]; then
    echo "Node.js project found"
    npm install
fi

for file in *.js; do
    echo "Linting $file"
    eslint "$file"
done

while read line; do
    echo "Processing: $line"
done &lt; users.txt</code></pre><h2>Funkce</h2><pre><code>deploy() {
    echo "Deploying $1..."
    ssh root@"$1" "cd /var/www && git pull"
}
deploy production</code></pre><p>Spustit: <code>chmod +x deploy.sh && ./deploy.sh</code></p>', 'lesson', 8, 10, 15),

(@term, 'Vyhledávání (find, grep pokročile, locate)', '<h2>find — hledání souborů</h2><pre><code>find . -name "*.js"                    # JS soubory
find . -name "*.sql" -type f           # pouze soubory
find /var/log -name "*.log" -mtime -7  # změněné za 7 dní
find . -size +100M                     # větší než 100MB
find . -name "*.tmp" -delete           # smaž .tmp soubory</code></pre><h2>grep pokročile</h2><pre><code>grep -rl "TODO" src/           # soubory obsahující TODO
grep -E "(error|warn)" log.txt  # regex: error NEBO warn
grep -A 3 "function" app.js     # 3 řádky po shodě
grep -B 2 "class" app.js       # 2 řádky před shodou</code></pre><h2>locate</h2><pre><code>sudo updatedb         # aktualizuj databázi
locate nginx.conf     # rychlé hledání</code></pre>', 'lesson', 9, 10, 12),

(@term, 'Package managers (apt, brew, yum)', '<h2>Debian/Ubuntu — apt</h2><pre><code>sudo apt update           # aktualizuj seznam balíčků
sudo apt upgrade           # aktualizuj nainstalované
sudo apt install nginx     # nainstaluj
sudo apt remove nginx      # odinstaluj
apt search node            # hledej balíček</code></pre><h2>macOS — Homebrew</h2><pre><code>/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node          # nainstaluj
brew uninstall node        # odinstaluj
brew update && brew upgrade # aktualizace
brew list                  # nainstalované</code></pre><h2>RHEL/CentOS — yum/dnf</h2><pre><code>sudo dnf install httpd
sudo dnf remove httpd
sudo dnf update</code></pre>', 'lesson', 10, 10, 10),

(@term, 'Git v terminálu — kompletní workflow', '<h2>Základní workflow</h2><pre><code>git init                        # nový repozitář
git clone https://github.com/user/repo.git  # klonuj
git status                      # stav souborů
git add .                        # stage všechny
git commit -m "feat: add login"  # commit
git push origin main             # push</code></pre><h2>Větve</h2><pre><code>git branch feature/login         # nová větev
git checkout feature/login       # přepni
git checkout -b feature/login    # vytvoř a přepni
git merge feature/login          # slouč do aktuální
git branch -d feature/login      # smaž větev</code></pre><h2>Pokročilé</h2><pre><code>git log --oneline --graph       # vizuální historie
git diff                        # změny nestageovaných
git stash                       # dočasně odlož změny
git stash pop                   # vrať odložené
git reset --soft HEAD~1         # vrať poslední commit (ponech změny)</code></pre>', 'lesson', 11, 10, 15),

(@term, 'Vim — přežití (i, Esc, :wq, :q!, dd, yy, /)', '<h2>Mody Vim</h2><p><strong>Normal</strong> (výchozí) — navigace, příkazy. <strong>Insert</strong> — psaní textu. <strong>Command</strong> — příkazy (ukládání, ukončení).</p><pre><code>i         # vstup do Insert módu
Esc       # zpět do Normal módu
:wq       # ulož a ukonči
:q!       # ukonči bez uložení</code></pre><h2>Navigace</h2><pre><code>h j k l   # levá, dolů, nahoru, pravá
gg        # začátek souboru
G         # konec souboru
0         # začátek řádku
$         # konec řádku
/ahoj     # hledej "ahoj" (n = další, N = předchozí)</code></pre><h2>Úpravy</h2><pre><code>dd        # smaž řádek
yy        # zkopíruj řádek
p         # vlož
u         # undo
Ctrl+r    # redo
x         # smaž znak pod kurzorem</code></pre>', 'lesson', 12, 10, 12),

(@term, 'Cron — plánování úloh', '<h2>Crontab</h2><pre><code>crontab -e          # uprav cron
crontab -l          # vypiš cron úlohy</code></pre><h2>Formát</h2><pre><code># min hod den_měsíc měsíc den_týdne
# ┌──── minuta (0-59)
# │ ┌──── hodina (0-23)
# │ │ ┌──── den v měsíci (1-31)
# │ │ │ ┌──── měsíc (1-12)
# │ │ │ │ ┌──── den v týdnu (0-7, 0 i 7 = neděle)

# Každý den v 2:00 — záloha DB
0 2 * * * /home/karel/backup.sh

# Každých 5 minut — health check
*/5 * * * * curl -s https://edu.vevit.fun/health > /dev/null

# Každé pondělí v 9:15 — report
15 9 * * 1 /home/karel/weekly-report.sh

# 1. den v měsíci v půlnoci
0 0 1 * * /home/karel/monthly-cleanup.sh</code></pre>', 'lesson', 13, 10, 12),

(@term, 'Síťové nástroje (ping, curl, wget, netstat, nslookup)', '<h2>Diagnostika</h2><pre><code>ping google.com               # test připojení (Ctrl+C stop)
ping -c 4 google.com          # 4 packety

curl https://api.vevit.fun/users   # HTTP GET
curl -X POST -d "{\"xp\":10}" https://api.vevit.fun/progress  # POST
curl -I https://edu.vevit.fun      # jen hlavičky

wget https://example.com/file.zip   # stáhni soubor
wget -q -O- https://api.vevit.fun/health  # výpis do stdout</code></pre><h2>Síťové informace</h2><pre><code>netstat -tlnp       # otevřené porty a procesy
ss -tlnp            # moderní alternativa
nslookup vevit.fun  # DNS záznam
dig vevit.fun       # detailní DNS
ifconfig / ip addr  # IP adresy</code></pre>', 'lesson', 14, 10, 12),

(@term, 'Oprávnění (chmod, chown, umask)', '<h2>Práva souborů</h2><pre><code># rwx = read, write, execute
# Vlastník | Skupina | Ostatní
-rw-r--r-- 1 karel users 120 app.js
# ↑ vlastník: rw-, skupina: r--, ostatní: r--</code></pre><h2>chmod — změna práv</h2><pre><code>chmod 755 script.sh    # rwxr-xr-x (spustitelný skript)
chmod 644 index.html    # rw-r--r-- (web soubor)
chmod +x deploy.sh      # přidej execute
chmod -w config.json    # odeber write (ochrana)</code></pre><h2>Číselné hodnoty</h2><pre><code>r = 4, w = 2, x = 1
7 = rwx, 6 = rw-, 5 = r-x, 4 = r--</code></pre><h2>chown — změna vlastníka</h2><pre><code>sudo chown www-data:www-data /var/www/html
sudo chown -R karel:karel ~/projekt/</code></pre><h2>umask</h2><pre><code>umask          # aktuální maska (např. 0022)
# Nové soubory: 644, nové složky: 755</code></pre>', 'lesson', 15, 10, 12),

(@term, 'Komprese (tar, gzip, zip)', '<h2>tar — archivace</h2><pre><code>tar -czf backup.tar.gz projekt/    # vytvoř gzip archiv
tar -xzf backup.tar.gz             # rozbal
tar -tf backup.tar.gz               # vypiš obsah</code></pre><h2>gzip — komprese</h2><pre><code>gzip access.log          # zkomprimuj (→ access.log.gz)
gunzip access.log.gz     # dekomprimuj
gzip -k access.log       # komprimuj, ponech originál</code></pre><h2>zip/unzip</h2><pre><code>zip -r projekt.zip projekt/      # vytvoř zip
unzip projekt.zip                # rozbal
unzip -l projekt.zip              # vypiš obsah</code></pre><h2>Kombinace pro zálohu</h2><pre><code># Záloha + komprese + datum
tar -czf vevit_$(date +%Y%m%d).tar.gz /var/www/edu.vevit.fun/
# Výsledek: vevit_20260413.tar.gz</code></pre>', 'lesson', 16, 10, 10),

(@term, 'Textové nástroje (sed, awk, sort, uniq, wc)', '<h2>sed — stream editor</h2><pre><code>sed "s/old/new/g" file.txt           # nahraď vše
sed -i "s/dev/prod/g" config.json   # nahraď in-place
sed -n "10,20p" file.txt              # vypiš řádky 10-20
sed "/^$/d" file.txt                  # smaž prázdné řádky</code></pre><h2>awk — zpracování textu</h2><pre><code>awk "{print $1, $3}" data.txt         # sloupce 1 a 3
awk -F: "{print $1}" /etc/passwd       # oddělovač :
awk "$3 > 100 {print $0}" data.txt     # filtruj</code></pre><h2>sort, uniq, wc</h2><pre><code>sort names.txt                    # seřaď
sort -n numbers.txt               # číselně
sort -r                           # sestupně
sort names.txt | uniq -c          # počty duplikátů
wc -l file.txt                    # počet řádků
wc -w file.txt                    # počet slov</code></pre>', 'lesson', 17, 10, 15),

(@term, 'Tmux — sessions a okna', '<h2>Tmux</h2><p>Multiplexer terminálu — jednu ssh session, více oken a panelů. Přežije odpojení (detach).</p><pre><code>tmux new -s vevit       # nová session "vevit"
tmux ls                  # seznam sessions
tmux attach -t vevit     # připoj se k session
tmux kill-session -t vevit</code></pre><h2>Klávesové zkratky (prefix = Ctrl+B)</h2><pre><code>Ctrl+B c    # nové okno
Ctrl+B n    # další okno
Ctrl+B p    # předchozí okno
Ctrl+B %    # rozdělit vertikálně
Ctrl+B "    # rozdělit horizontálně
Ctrl+B d    # detach (odpoj, session běží dál)</code></pre><h2>Praktický scénář</h2><pre><code># Na serveru: spusť aplikaci v tmux
tmux new -s app
node server.js
# Ctrl+B d — odpoj

# Později: připoj se zpět
tmux attach -t app</code></pre>', 'lesson', 18, 10, 12),

(@term, 'Docker základy z CLI', '<h2>Základní příkazy</h2><pre><code>docker ps                       # běžící kontejnery
docker ps -a                    # všechny (i zastavené)
docker images                   # seznam obrazů

# Spuštění
docker run -d -p 3000:3000 --name vevit-app node:18
docker run -it ubuntu bash      # interaktivní

# Správa
docker stop vevit-app
docker start vevit-app
docker rm vevit-app             # smazat kontejner
docker rmi node:18              # smazat obraz

# Logy
docker logs vevit-app
docker logs -f vevit-app        # follow (realtime)</code></pre><h2>Docker Compose</h2><pre><code>docker-compose up -d            # spusť služby na pozadí
docker-compose down             # zastav a smaž
docker-compose logs -f          # logy všech služeb</code></pre>', 'lesson', 19, 10, 15),

(@term, 'Wedos server specifika — Apache restart, logy, .htaccess', '<h2>Apache na Wedosu</h2><pre><code># Restart Apache (přes admin panel Wedosu)
# NEBO přes SSH (pokud máš přístup):
sudo systemctl restart apache2
sudo systemctl reload apache2   # jemnější — bez přerušení

# Stav
sudo systemctl status apache2
apache2ctl configtest           # ověř konfiguraci</code></pre><h2>Logy</h2><pre><code># Přístupové logy
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log

# Wedos specifika
# /var/www/edu.vevit.fun/logs/error.log
# Realtime sledování:
tail -f /var/log/apache2/error.log | grep "PHP"</code></pre><h2>.htaccess</h2><pre><code># Přesměrování na HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# pretty URLs (SPA)
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# Blokování přístupu k .env
&lt;Files ".env"&gt;
    Require all denied
&lt;/Files&gt;</code></pre>', 'lesson', 20, 10, 15);


-- ============================================================
-- ZÁVĚREČNÝ KVÍZ: Terminál & Bash (sort_order 21)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@term, 'Závěrečný kvíz — Terminál & Bash', '<p>Závěrečný test pokrývající terminálové příkazy, Bash skripty a serverovou správu.</p>', 'final_quiz', 21, 100, 20);

SET @qfin_term = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@qfin_term, 'Co vypíše pwd?', 'Obsah aktuální složky', 'Cestu k aktuální složce', 'Seznam souborů', 'IP adresu', 'b', 'pwd (print working directory) vypíše absolutní cestu k aktuálnímu adresáři.', 1),
(@qfin_term, 'Co dělá rm -rf slozka/?', 'Smaže složku i obsahem bez potvrzení', 'Přesune složku do koše', 'Vytvoří novou složku', 'Zobrazí obsah', 'a', 'rm -rf smaže rekurzivně a bez potvrzení — velmi nebezpečné, pokud zadáš špatnou cestu!', 2),
(@qfin_term, 'Co znamená | (pipe)?', 'Přesměrování do souboru', 'Výstup jednoho příkazu jako vstup dalšího', 'Logické OR', 'Komentář', 'b', 'Pipe (|) spojuje příkazy — výstup prvního se stává vstupem druhého. Např. ls | grep ".js".', 3),
(@qfin_term, 'Jaký režim Vimu slouží k psaní textu?', 'Normal mode', 'Insert mode', 'Command mode', 'Visual mode', 'b', 'Insert mode (klávesa i) umožňuje psaní textu. Zpět do Normal mode klávesou Esc.', 4),
(@qfin_term, 'Co znamená chmod 755 script.sh?', 'rwxr-xr-x — vlastník vše, ostatní čtení a spuštění', 'rwxrwxrwx — všichni vše', 'rw-r--r-- — jen vlastník píše', 'r--r--r-- — všichni jen čtení', 'a', '7=rwx, 5=r-x, 5=r-x. Vlastník může číst, psát i spouštět; skupina a ostatní jen číst a spouštět.', 5),
(@qfin_term, 'Jak vytvoříš SSH klíč?', 'ssh-keygen -t ed25519', 'ssh create-key', 'ssh-copy-id', 'ssh --generate', 'a', 'ssh-keygen -t ed25519 vygeneruje SSH klíč. ssh-copy-id ho zkopíruje na server.', 6),
(@qfin_term, 'Co dělá tmux detach (Ctrl+B d)?', 'Ukončí tmux session', 'Odpojí se od session, která běží dál na pozadí', 'Smaže všechna okna', 'Restartuje terminál', 'b', 'Detach odpojí tvého klienta, ale tmux session i procesy uvnitř běží dál — můžeš se připojit zpět.', 7),
(@qfin_term, 'Jaký crontab záznam spustí skript každý den v půlnoci?', '* * * * *', '0 0 * * *', '0 24 * * *', '@daily', 'b', '0 0 * * * = minuta 0, hodina 0 (půlnoc), každý den v měsíci, každý měsíc, každý den v týdnu.', 8),
(@qfin_term, 'Co dělá curl -I https://example.com?', 'Stáhne celou stránku', 'Zobrazí jen HTTP hlavičky odpovědi', 'Změní HTTP metodu na POST', 'Ignoruje SSL chyby', 'b', 'curl -I (head request) vypíše jen hlavičky odpovědi — užitečné pro kontrolu status kódu a cache.', 9),
(@qfin_term, 'Jak zjistíš, který proces poslouchá na portu 80?', 'ping 80', 'netstat -tlnp | grep :80', 'ls -la :80', 'http 80', 'b', 'netstat -tlnp | grep :80 vypíše proces, který poslouchá na portu 80 (obvykle Apache/Nginx).', 10);


UPDATE courses SET lesson_count = (SELECT COUNT(*) FROM lessons WHERE course_id = @term) WHERE id = @term;