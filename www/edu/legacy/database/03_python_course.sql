-- Python kurz — Kompletní kurz (Sekce 1-5 + všechny kvízy)
-- MariaDB 10.4, phpMyAdmin style, no DELIMITER
-- Apostrofy escapovány jako ''

SET @kurs_id = (SELECT id FROM courses WHERE slug = 'python');

-- ============================================================
-- SEKCE 1: Základy Pythonu (sort_order 1-18)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Instalace a první program', '<h2>Instalace Pythonu</h2><p>Stáhni Python z python.org a ověř instalaci příkazem <code>python --version</code>. Nezapomeň zaškrtnout Add Python to PATH.</p><pre><code>print("Ahoj, VeVit!")\nprint(2 + 2)</code></pre>', 'lesson', 1, 10, 10),

(@kurs_id, 'Proměnné a přiřazení', '<h2>Proměnné</h2><p>Proměnná odkazuje na hodnotu. Python používá dynamické typování. Jména ve snake_case, nesmí začínat číslem.</p><pre><code>jmeno = "Karel"\nvek = 25\nprumer = 4.8\nprint(type(vek))  # &lt;class ''int''&gt;</code></pre>', 'lesson', 2, 10, 10),

(@kurs_id, 'Datové typy', '<h2>Datové typy</h2><p>Základní typy: <code>int</code> (celé), <code>float</code> (desetinné), <code>str</code> (řetězec), <code>bool</code> (True/False). Typ zjistíš funkcí <code>type()</code>.</p><pre><code>x = 42         # int\ny = 3.14       # float\ns = "ahoj"     # str\nb = True       # bool\nprint(type(x)) # &lt;class ''int''&gt;</code></pre>', 'lesson', 3, 10, 10),

(@kurs_id, 'Operátory', '<h2>Operátory</h2><p>Aritmetické: <code>+ - * / // % **</code>. Porovnávací: <code>== != &lt; &gt; &lt;= &gt;=</code>. Logické: <code>and or not</code>.</p><pre><code>print(10 // 3)   # 3\nprint(2 ** 8)    # 256\nprint(5 > 3 and 2 < 4)  # True</code></pre>', 'lesson', 4, 10, 10),

(@kurs_id, 'Řetězce', '<h2>Řetězce</h2><p>Neměnná sekvence znaků. Indexování od 0, záporné od konce. Řezy: <code>[start:konec:krok]</code>. Metody: <code>upper, lower, strip, split, join</code>.</p><pre><code>s = "VeVit"\nprint(s[0])      # V\nprint(s[-1])     # t\nprint(s.upper()) # VEVIT\nprint(",".join(["a","b"]))  # a,b</code></pre>', 'lesson', 5, 10, 12),

(@kurs_id, 'f-stringy a formátování', '<h2>f-stringy</h2><p>Prefix <code>f</code> umožňuje vložit proměnné do <code>{}</code>. Formátování: <code>:.2f</code> pro desetinná místa. Alternativně <code>.format()</code>.</p><pre><code>jmeno = "Karel"\nvek = 25\nprint(f"{jmeno} je {vek} let stary")\npi = 3.14159\nprint(f"Pi = {pi:.2f}")  # Pi = 3.14</code></pre>', 'lesson', 6, 10, 10),

(@kurs_id, 'input() a konverze typů', '<h2>Vstup od uživatele</h2><p><code>input()</code> vždy vrací řetězec. Převeď na číslo pomocí <code>int()</code> nebo <code>float()</code>.</p><pre><code>jmeno = input("Jmeno: ")\nvek = int(input("Vek: "))\nprint(f"{jmeno}, {vek} let")</code></pre>', 'lesson', 7, 10, 10),

(@kurs_id, 'Podmínky', '<h2>Podmínky if/elif/else</h2><p>Blok kódu se provede jen při splnění podmínky. <code>elif</code> pro další varianty, <code>else</code> pro zbytek. Ternární: <code>x if podm else y</code>.</p><pre><code>vek = 18\nif vek >= 18:\n    print("Dospely")\nelif vek >= 15:\n    print("Stredni skola")\nelse:\n    print("Zakladni skola")</code></pre>', 'lesson', 8, 10, 12),

(@kurs_id, 'Cyklus while', '<h2>Cyklus while</h2><p>Opakuje blok, dokud je podmínka True. <code>break</code> ukončí cyklus, <code>continue</code> přeskočí iteraci. Nekonečný: <code>while True</code>.</p><pre><code>i = 0\nwhile i < 5:\n    print(i)\n    i += 1\n\nwhile True:\n    cmd = input("> ")\n    if cmd == "konec":\n        break</code></pre>', 'lesson', 9, 10, 12),

(@kurs_id, 'Cyklus for', '<h2>Cyklus for</h2><p>Iteruje přes iterable objekty. <code>range(start, stop, step)</code> generuje posloupnost. <code>else</code> se provede, pokud cyklus neskončil break.</p><pre><code>for i in range(5):\n    print(i)  # 0 1 2 3 4\n\nfor ch in "Ahoj":\n    print(ch)  # A h o j</code></pre>', 'lesson', 10, 10, 12),

(@kurs_id, 'Funkce', '<h2>Funkce</h2><p>Definice klíčovým slovem <code>def</code>. Parametry, návrat <code>return</code>. Docstring popisuje účel funkce jako první řetězec.</p><pre><code>def pozdrav(jmeno):\n    """Vrať pozdrav pro jmeno."""\n    return f"Ahoj, {jmeno}!"\n\nprint(pozdrav("Karel"))  # Ahoj, Karel!</code></pre>', 'lesson', 11, 10, 12),

(@kurs_id, 'Výchozí parametry a *args, **kwargs', '<h2>Pokročilé parametry</h2><p>Výchozí hodnoty: <code>def f(x=10)</code>. <code>*args</code> sbírá poziční argumenty do tuple, <code>**kwargs</code> pojmenované do dict.</p><pre><code>def soucet(*cisla):\n    return sum(cisla)\n\nprint(soucet(1, 2, 3))  # 6\n\ndef info(**kw):\n    print(kw)\n\ninfo(jmeno="Karel", vek=25)</code></pre>', 'lesson', 12, 10, 13),

(@kurs_id, 'Scope proměnných', '<h2>Scope proměnných</h2><p>Lokální proměnné existují jen uvnitř funkce. <code>global</code> umožňuje modifikovat globální proměnnou. LEGB pravidlo: Local, Enclosing, Global, Built-in.</p><pre><code>x = 10  # global\n\ndef f():\n    x = 5  # local\n    print(x)  # 5\n\nf()\nprint(x)  # 10</code></pre>', 'lesson', 13, 10, 10),

(@kurs_id, 'Rekurze', '<h2>Rekurze</h2><p>Funkce volá sama sebe. Musí mít základní případ, jinak RecursionError. Klasické příklady: faktoriál, Fibonacci.</p><pre><code>def faktorial(n):\n    if n <= 1:\n        return 1\n    return n * faktorial(n - 1)\n\nprint(faktorial(5))  # 120</code></pre>', 'lesson', 14, 10, 13),

(@kurs_id, 'Moduly', '<h2>Moduly</h2><p>Modul = .py soubor. <code>import modul</code> načte celý, <code>from modul import f</code> jen funkci. <code>if __name__ == "__main__"</code> pro přímé spuštění.</p><pre><code>import math\nprint(math.sqrt(16))  # 4.0\n\nfrom random import randint\nprint(randint(1, 10))</code></pre>', 'lesson', 15, 10, 10),

(@kurs_id, 'Standardní knihovna', '<h2>Standardní knihovna</h2><p>Vestavěné moduly bez instalace: <code>math</code>, <code>random</code>, <code>datetime</code>, <code>os</code>, <code>json</code>, <code>csv</code>, <code>collections</code>.</p><pre><code>import datetime\nprint(datetime.date.today())\n\nimport os\nprint(os.getcwd())  # aktualni adresar\n\nimport json\ndata = json.loads(''{"a":1}'')</code></pre>', 'lesson', 16, 10, 12),

(@kurs_id, 'Výjimky', '<h2>Výjimky try/except</h2><p><code>try</code> obsahuje rizikový kód, <code>except</code> zachytí chybu. <code>finally</code> se provede vždy. <code>raise</code> vyvolá výjimku ručně.</p><pre><code>try:\n    x = int("abc")\nexcept ValueError:\n    print("Neplatny vstup!")\nfinally:\n    print("Hotovo.")\n\nraise TypeError("Spatny typ")</code></pre>', 'lesson', 17, 10, 12),

(@kurs_id, 'Ladění', '<h2>Ladění kódu</h2><p><code>print()</code> debugging pro rychlou diagnostiku. Interaktivní debugger <code>pdb</code>: <code>breakpoint()</code> zastaví běh a umožní prozkoumat proměnné.</p><pre><code># Print debugging\nx = 42\nprint(f"debug: x = {x}")\n\n# pdb debugger\ndef f(n):\n    breakpoint()  # zastavi zde\n    return n * 2</code></pre>', 'lesson', 18, 10, 10);


-- ============================================================
-- KVÍZ 1: Základy Pythonu (sort_order 19)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 1 — Základy Pythonu', '<p>Ověř znalosti proměnných, podmínek, cyklů a funkcí.</p>', 'quiz', 19, 50, 15);

SET @q1 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q1, 'Co vypíše print(type(42))?', '<class ''float''>', '<class ''int''>', '<class ''str''>', '<class ''number''>', 'b', '42 je celé číslo, tedy typ int.', 1),
(@q1, 'Jak se jmenuje konvence pojmenovávání proměnných v Pythonu?', 'camelCase', 'PascalCase', 'snake_case', 'kebab-case', 'c', 'Python používá snake_case pro názvy proměnných a funkcí.', 2),
(@q1, 'Co vrátí "vevit".upper()?', 'vevit', 'VEVIT', 'Vevit', 'chyba', 'b', 'Metoda upper() převede všechna písmena na velká.', 3),
(@q1, 'Jaký je výsledek 10 // 3?', '3.33', '3', '4', '1', 'b', 'Operátor // provádí celočíselné dělení (floor division).', 4),
(@q1, 'Co dělá break v cyklu?', 'Skočí na začátek', 'Ukončí celý cyklus', 'Přeskočí iteraci', 'Nic', 'b', 'break okamžitě ukončí nejbližší cyklus.', 5),
(@q1, 'Jaký je výsledek bool("") v Pythonu?', 'True', 'False', 'None', 'Error', 'b', 'Prázdný řetězec je falsy — bool("") vrací False.', 6),
(@q1, 'Jak se importuje modul math?', 'include math', 'require math', 'import math', 'use math', 'c', 'V Pythonu se moduly importují klíčovým slovem import.', 7),
(@q1, 'Co je docstring?', 'Typ proměnné', 'Řetězcový literál popisující funkci', 'Komentář za #', 'Chybová zpráva', 'b', 'Docstring je první řetězec ve funkci/třídě, popisuje její účel.', 8),
(@q1, 'Co vypíše range(3)?', '[1,2,3]', '[0,1,2]', '[0,1,2,3]', 'range object', 'b', 'range(3) generuje 0, 1, 2 — horní mez není zahrnuta.', 9),
(@q1, 'Jak zachytíš výjimku TypeError?', 'catch TypeError', 'except TypeError', 'handle TypeError', 'on TypeError', 'b', 'V Pythonu se výjimky zachycují klíčovým slovem except.', 10);


-- ============================================================
-- SEKCE 2: Datové struktury a OOP (sort_order 20-31)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Listy', '<h2>Seznamy (list)</h2><p>Uspořádaná měnitelná kolekce. Index od 0. Metody: <code>append, pop, remove, sort, reverse, insert</code>.</p><pre><code>ovoce = ["jablko", "banan"]\novoce.append("hruska")\novoce.sort()\nprint(ovoce[0])  # banan</code></pre>', 'lesson', 20, 15, 12),

(@kurs_id, 'List comprehensions', '<h2>List comprehensions</h2><p>Stručná syntaxe pro tvorbu seznamu: <code>[výraz for x in iterable if podmínka]</code>. Rychlejší a čitelnější než for+append.</p><pre><code>ctverce = [x**2 for x in range(6)]\n# [0, 1, 4, 9, 16, 25]\nsuda = [x for x in range(10) if x % 2 == 0]\n# [0, 2, 4, 6, 8]</code></pre>', 'lesson', 21, 15, 13),

(@kurs_id, 'Tuple', '<h2>Tuple</h2><p>Neměnná sekvence v kulatých závorkách. Unpacking: rozbalení do proměnných. <code>namedtuple</code> pro pojmenované položky.</p><pre><code>souradnice = (50.08, 14.42)\nx, y = souradnice  # unpacking\nprint(x)  # 50.08\n\nfrom collections import namedtuple\nBod = namedtuple("Bod", "x y")\np = Bod(1, 2)</code></pre>', 'lesson', 22, 15, 12),

(@kurs_id, 'Set', '<h2>Set (množina)</h2><p>Neuspořádaná kolekce unikátních prvků. Operace: průnik <code>&amp;</code>, sjednocení <code>|</code>, rozdíl <code>-</code>, symetrický rozdíl <code>^</code>.</p><pre><code>a = {1, 2, 3}\nb = {3, 4, 5}\nprint(a &amp; b)  # {3}\nprint(a | b)  # {1,2,3,4,5}\nprint(list(set([1,1,2,2,3])))  # [1,2,3]</code></pre>', 'lesson', 23, 15, 12),

(@kurs_id, 'Dictionary', '<h2>Slovníky (dict)</h2><p>Kolekce klíč–hodnota. Přístup: <code>d["klic"]</code> nebo <code>d.get("klic", default)</code>. Metody: <code>keys, values, items</code>.</p><pre><code>student = {"jmeno": "Karel", "vek": 20}\nprint(student["jmeno"])  # Karel\nprint(student.get("prumer", "N/A"))\nfor k, v in student.items():\n    print(f"{k}: {v}")</code></pre>', 'lesson', 24, 15, 13),

(@kurs_id, 'Dict comprehensions a merge', '<h2>Dict comprehensions</h2><p>Obdoba list comprehension pro slovníky: <code>{k: v for k, v in iterable}</code>. Merge: <code>{**a, **b}</code> sloučí dva slovníky.</p><pre><code>ctverce = {x: x**2 for x in range(5)}\n# {0:0, 1:1, 2:4, 3:9, 4:16}\n\na = {"x": 1}\nb = {"y": 2}\nmerged = {**a, **b}  # {"x":1, "y":2}</code></pre>', 'lesson', 25, 15, 13),

(@kurs_id, 'OOP — Třídy a objekty', '<h2>Třídy v Pythonu</h2><p><code>class</code> definuje třídu, <code>__init__</code> je konstruktor. <code>self</code> odkazuje na instanci. Atributy instance vs třídy.</p><pre><code>class Zvire:\n    druh = "neznamy"  # class atribut\n    def __init__(self, jmeno):\n        self.jmeno = jmeno  # instance atribut\n\nk = Zvire("Karel")\nprint(k.jmeno)  # Karel</code></pre>', 'lesson', 26, 15, 15),

(@kurs_id, 'OOP — Dědičnost', '<h2>Dědičnost</h2><p>Třída může dědit od jiné. <code>super()</code> volá metodu rodiče. Přepisování (override) nahrazuje rodičovskou metodu.</p><pre><code>class Zvire:\n    def zvuk(self):\n        return "..."\n\nclass Pes(Zvire):\n    def zvuk(self):\n        return "Haf!"\n    def __init__(self, jmeno):\n        super().__init__()\n        self.jmeno = jmeno</code></pre>', 'lesson', 27, 15, 15),

(@kurs_id, 'OOP — Magic methods', '<h2>Magic methods</h2><p>Speciální metody s dvojitým podtržením: <code>__str__</code> pro print, <code>__repr__</code> pro debug, <code>__len__</code>, <code>__eq__</code>, operátory <code>__add__</code> aj.</p><pre><code>class Bod:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def __str__(self):\n        return f"({self.x}, {self.y})"\n    def __eq__(self, other):\n        return self.x == other.x and self.y == other.y</code></pre>', 'lesson', 28, 15, 15),

(@kurs_id, 'Dekorátory', '<h2>Dekorátory</h2><p><code>@property</code> — metoda jako atribut. <code>@staticmethod</code> — bez self. <code>@classmethod</code> — cls místo self. Vlastní dekorátor obaluje funkci.</p><pre><code>class Kruh:\n    def __init__(self, r):\n        self.r = r\n    @property\n    def obsah(self):\n        return 3.14 * self.r ** 2\n\ndef debug(func):\n    def wrapper(*args):\n        print(f"Volam {func.__name__}")\n        return func(*args)\n    return wrapper</code></pre>', 'lesson', 29, 15, 16),

(@kurs_id, 'Generátory', '<h2>Generátory</h2><p><code>yield</code> vrátí hodnotu a pozastaví funkci. Generátor produkuje hodnoty líně. Generator expression: <code>(x**2 for x in range(10))</code>.</p><pre><code>def counter(n):\n    i = 0\n    while i < n:\n        yield i\n        i += 1\n\nfor x in counter(3):\n    print(x)  # 0 1 2</code></pre>', 'lesson', 30, 15, 14),

(@kurs_id, 'Kontextové manažery', '<h2>Kontextové manažery</h2><p><code>with</code> zaručí cleanup. Vlastní manažer: třídy s <code>__enter__</code> a <code>__exit__</code>, nebo <code>@contextmanager</code> z contextlib.</p><pre><code>from contextlib import contextmanager\n\n@contextmanager\ndef timer():\n    import time\n    start = time.time()\n    yield\n    print(f"Trvalo: {time.time()-start:.2f}s")\n\nwith timer():\n    sum(range(1000000))</code></pre>', 'lesson', 31, 15, 15);


-- ============================================================
-- KVÍZ 2: Datové struktury a OOP (sort_order 32)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 2 — Datové struktury a OOP', '<p>Ověř znalosti seznamů, slovníků, OOP a dekorátorů.</p>', 'quiz', 32, 50, 15);

SET @q2 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q2, 'Co je list comprehension?', 'Kopie listu', 'Syntaxe pro tvorbu listu výrazem', 'Třídění listu', 'Filtrování na místě', 'b', 'List comprehension je stručná syntaxe [výraz for x in iterable if podmínka].', 1),
(@q2, 'Jaký je rozdíl mezi list a tuple?', 'Žádný', 'Tuple je immutable', 'Tuple je rychlejší', 'List nemá indexy', 'b', 'Tuple je neměnný (immutable), zatímco list lze modifikovat.', 2),
(@q2, 'Co vrátí {1,2,2,3}?', '{1,2,2,3}', '{1,2,3}', '[1,2,3]', 'Error', 'b', 'Set automaticky odstraní duplikáty, výsledek je {1,2,3}.', 3),
(@q2, 'Jak přidáš pár do slovníku d?', 'd.add(k,v)', 'd[k] = v', 'd.insert(k,v)', 'd.put(k,v)', 'b', 'Do slovníku se přidává přiřazením d[klic] = hodnota.', 4),
(@q2, 'Co dělá super().__init__()?', 'Volá init rodičovské třídy', 'Smaže objekt', 'Kopíruje třídu', 'Nic', 'a', 'super() volá konstruktor rodičovské třídy v rámci dědičnosti.', 5),
(@q2, 'Co je @property?', 'Dekorátor pro metodu jako atribut', 'Import modulu', 'Typ proměnné', 'Anotace', 'a', '@property umožňuje přistupovat k metodě jako k atributu bez závorek.', 6),
(@q2, 'Co dělá yield?', 'Vrátí hodnotu a ukončí funkci', 'Pozastaví funkci a vrátí hodnotu', 'Vyhodí výjimku', 'Skočí na začátek', 'b', 'yield vrátí hodnotu a pozastaví generátor — při dalším volání pokračuje.', 7),
(@q2, 'K čemu slouží with statement?', 'Import modulů', 'Správa kontextů (automatický cleanup)', 'Podmínka', 'Cyklus', 'b', 'with zaručí automatické uvolnění prostředků (např. zavření souboru).', 8),
(@q2, 'Co vrátí dict.get("klic", "default")?', 'Chyba pokud klíč neexistuje', 'Hodnotu nebo "default"', 'None', 'False', 'b', 'Metoda get() vrátí hodnotu klíče, nebo výchozí hodnotu pokud klíč chybí.', 9),
(@q2, 'Co je __str__?', 'Privátní atribut', 'Magic method pro string reprezentaci objektu', 'Typ proměnné', 'Import', 'b', '__str__ definuje, jak se objekt zobrazí v print() a str().', 10);


-- ============================================================
-- SEKCE 3: Pokročilý Python (sort_order 33-40)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Soubory', '<h2>Práce se soubory</h2><p><code>open()</code> s režimy "r", "w", "a". Vždy používej <code>with</code> pro automatické uzavření. <code>pathlib.Path</code> nabízí objektový přístup.</p><pre><code>with open("data.txt", "r", encoding="utf-8") as f:\n    obsah = f.read()\n\nfrom pathlib import Path\nPath("out.txt").write_text("ok", encoding="utf-8")</code></pre>', 'lesson', 33, 15, 13),

(@kurs_id, 'Regulární výrazy', '<h2>Regulární výrazy</h2><p>Modul <code>re</code>: <code>match</code> od začátku, <code>search</code> kdekoli, <code>findall</code> všechny shody, <code>sub</code> nahrazení. Vzory: <code>\d</code> číslice, <code>\w</code> slovo, <code>.</code> cokoliv.</p><pre><code>import re\nprint(re.findall(r"\d+", "a1b22c333"))\n# [''1'', ''22'', ''333'']\nprint(re.sub(r"\s+", " ", "  a  b  "))\n# " a b "</code></pre>', 'lesson', 34, 15, 14),

(@kurs_id, 'asyncio', '<h2>asyncio</h2><p>Asynchronní I/O s <code>async def</code> a <code>await</code>. <code>asyncio.run()</code> spustí event loop. <code>asyncio.gather()</code> čeká na více coroutines paralelně.</p><pre><code>import asyncio\n\nasync def fetch(url):\n    await asyncio.sleep(1)\n    return f"data from {url}"\n\nasync def main():\n    results = await asyncio.gather(\n        fetch("a.com"), fetch("b.com"))\n    print(results)\n\nasyncio.run(main())</code></pre>', 'lesson', 35, 15, 16),

(@kurs_id, 'sqlite3', '<h2>Databáze sqlite3</h2><p>Vestavěný modul pro SQLite. <code>connect()</code>, <code>cursor()</code>, <code>execute()</code>. Vždy parametrizované dotazy <code>?</code> proti SQL injekci.</p><pre><code>import sqlite3\nconn = sqlite3.connect("app.db")\ncur = conn.cursor()\ncur.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)")\ncur.execute("INSERT INTO users (name) VALUES (?)", ("Karel",))\nconn.commit()\nfor row in cur.execute("SELECT * FROM users"):\n    print(row)</code></pre>', 'lesson', 36, 15, 15),

(@kurs_id, 'pytest', '<h2>pytest</h2><p>Testy jako funkce s prefixem <code>test_</code>. <code>assert</code> pro ověření. <code>pytest.raises</code> ověří výjimku. Fixtures pro sdílené nastavení.</p><pre><code>import pytest\n\ndef test_soucet():\n    assert 2 + 3 == 5\n\ndef test_deleni_nulou():\n    with pytest.raises(ZeroDivisionError):\n        1 / 0\n\n@pytest.fixture\ndef data():\n    return [1, 2, 3]</code></pre>', 'lesson', 37, 15, 14),

(@kurs_id, 'Type hints', '<h2>Type hints</h2><p>Anotace typů: <code>def f(x: int) -> str</code>. <code>Optional[T]</code> = T nebo None. <code>Union[A, B]</code> = A nebo B. Od 3.10: <code>T | None</code>. Nástroj mypy kontroluje typy.</p><pre><code>from typing import Optional\n\ndef najdi(id: int) -> Optional[str]:\n    if id > 0:\n        return f"user_{id}"\n    return None\n\ndef spocti(cisla: list[float]) -> float:\n    return sum(cisla) / len(cisla)</code></pre>', 'lesson', 38, 15, 14),

(@kurs_id, 'Dataclasses', '<h2>@dataclass</h2><p>Automaticky generuje <code>__init__</code>, <code>__repr__</code>, <code>__eq__</code>. <code>field()</code> pro výchozí hodnoty. <code>frozen=True</code> pro neměnnost. <code>__post_init__</code> pro validaci.</p><pre><code>from dataclasses import dataclass, field\n\n@dataclass\nclass Student:\n    jmeno: str\n    rocnik: int = 1\n    predmety: list = field(default_factory=list)\n\n@dataclass(frozen=True)\nclass Bod:\n    x: float\n    y: float</code></pre>', 'lesson', 39, 15, 14),

(@kurs_id, 'Virtuální prostředí', '<h2>venv a pip</h2><p><code>python -m venv .venv</code> vytvoří izolované prostředí. <code>pip install</code> instaluje balíčky. <code>pip freeze > requirements.txt</code> zamkne verze.</p><pre><code>python -m venv .venv\nsource .venv/bin/activate  # Linux\n.venv\\Scripts\\activate     # Windows\npip install flask requests\npip freeze > requirements.txt\npip install -r requirements.txt</code></pre>', 'lesson', 40, 15, 12);


-- ============================================================
-- KVÍZ 3: Pokročilý Python (sort_order 41)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 3 — Pokročilý Python', '<p>Ověř znalosti souborů, async, databází, testování a typů.</p>', 'quiz', 41, 50, 15);

SET @q3 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q3, 'Jak otevřeš soubor pro čtení?', 'open("f","w")', 'open("f","r")', 'open("f","a")', 'file.open("f")', 'b', 'Mód "r" otevře soubor pro čtení (read).', 1),
(@q3, 'Co dělá asyncio.gather()?', 'Spustí coroutiny sekvenčně', 'Paralelně čeká na více coroutines', 'Zruší tasky', 'Vytvoří thread pool', 'b', 'asyncio.gather() spustí více coroutines konkurenčně a čeká na všechny.', 2),
(@q3, 'Co je @dataclass?', 'Databázová třída', 'Dekorátor generující init/repr/eq automaticky', 'Typ anotace', 'Abstract třída', 'b', '@dataclass automaticky generuje __init__, __repr__, __eq__ na základě anotací.', 3),
(@q3, 'K čemu slouží pytest.raises()?', 'Vyhodí výjimku záměrně', 'Ověří že kód vyhodí očekávanou výjimku', 'Ignoruje výjimky', 'Loguje výjimky', 'b', 'pytest.raises(Odkaz) ověří, že blok kódu vyhodí specifikovanou výjimku.', 4),
(@q3, 'Co je Optional[str] v type hints?', 'Povinný string', 'String nebo None', 'Prázdný string', 'Libovolný typ', 'b', 'Optional[T] znamená T | None — hodnota může být daného typu nebo None.', 5);


-- ============================================================
-- SEKCE 4: Praktický Python (sort_order 42-52)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'pip a balíčky', '<h2>pip a správa balíčků</h2><p><code>pip install</code> instaluje, <code>pip uninstall</code> odebírá. <code>requirements.txt</code> zamkne závislosti. Vždy pracuj ve venv.</p><pre><code>pip install requests flask\npip install flask==3.0.0\npip list\npip freeze > requirements.txt\npip install -r requirements.txt</code></pre>', 'lesson', 42, 15, 12),

(@kurs_id, 'requests', '<h2>Knihovna requests</h2><p>HTTP klient: <code>get/post</code>, hlavičky, parametry, JSON. <code>Session()</code> sdílí cookies. Vždy nastav <code>timeout</code>.</p><pre><code>import requests\nr = requests.get("https://api.example.com/data", timeout=5)\nprint(r.status_code)\nprint(r.json())\n\ns = requests.Session()\ns.headers.update({"Auth": "Bearer token"})\nr = s.post("https://api.example.com/add", json={"name": "test"})</code></pre>', 'lesson', 43, 15, 14),

(@kurs_id, 'Web scraping', '<h2>Web scraping</h2><p>Kombinace <code>requests</code> + <code>BeautifulSoup</code>. CSS selektory: <code>select()</code>, <code>select_one()</code>. Vždy respektuj <code>robots.txt</code> a omez frekvenci.</p><pre><code>from bs4 import BeautifulSoup\nimport requests\nr = requests.get("https://example.com")\nsoup = BeautifulSoup(r.text, "html.parser")\nfor h in soup.select("h2"):\n    print(h.get_text())\nlink = soup.select_one("a")["href"]</code></pre>', 'lesson', 44, 15, 15),

(@kurs_id, 'Flask — základy', '<h2>Flask základy</h2><p>Mikroframework: <code>@app.route</code> definuje URL, <code>request</code> přistupuje k datům, <code>jsonify</code> vrací JSON. Spustíš <code>flask run</code>.</p><pre><code>from flask import Flask, request, jsonify\napp = Flask(__name__)\n\n@app.route("/")\ndef index():\n    return jsonify({"status": "ok"})\n\n@app.route("/greet")\ndef greet():\n    name = request.args.get("name", "svete")\n    return f"Ahoj, {name}!"</code></pre>', 'lesson', 45, 15, 15),

(@kurs_id, 'Flask — Blueprint a error handelery', '<h2>Flask Blueprint</h2><p><code>Blueprint</code> rozdělí aplikaci do modulů. <code>url_for()</code> generuje URL. <code>abort()</code> vrátí HTTP chybu. Error handelery zachytí výjimky.</p><pre><code>from flask import Blueprint, abort, url_for\napi = Blueprint("api", __name__, url_prefix="/api")\n\n@api.route("/users/<int:id>")\ndef user(id):\n    if id < 1:\n        abort(404)\n    return f"User {id}"\n\n@app.errorhandler(404)\ndef not_found(e):\n    return jsonify({"error": "Not found"}), 404</code></pre>', 'lesson', 46, 15, 15),

(@kurs_id, 'REST API s Flaskem', '<h2>REST API</h2><p>CRUD: GET čte, POST vytváří, PUT aktualizuje, DELETE maže. JSON vstup přes <code>request.get_json()</code>. Validace dat.</p><pre><code>from flask import Flask, request, jsonify\napp = Flask(__name__)\ntasks = []\n\n@app.route("/tasks", methods=["GET","POST"])\ndef tasks_handler():\n    if request.method == "POST":\n        data = request.get_json()\n        tasks.append(data)\n        return jsonify(data), 201\n    return jsonify(tasks)</code></pre>', 'lesson', 47, 15, 16),

(@kurs_id, 'Pandas intro', '<h2>Pandas</h2><p><code>DataFrame</code> — tabulková struktura. <code>read_csv()</code> načte data. <code>head/info/describe</code> pro přehled. Filtrování řádků podmínkou.</p><pre><code>import pandas as pd\ndf = pd.read_csv("data.csv")\nprint(df.head())\nprint(df.info())\nseniori = df[df["plat"] > 50000]\nprint(df["plat"].mean())</code></pre>', 'lesson', 48, 15, 15),

(@kurs_id, 'NumPy intro', '<h2>NumPy</h2><p><code>ndarray</code> — vícerozměrné pole. Rychlé vektorové operace. <code>shape</code>, <code>dtype</code>. Broadcasting automaticky rozšíří menší pole.</p><pre><code>import numpy as np\na = np.array([1, 2, 3])\nprint(a * 10)  # [10 20 30]\nb = np.array([[1,2],[3,4]])\nprint(b.shape)  # (2, 2)\nprint(np.sum(b, axis=0))  # [4 6]</code></pre>', 'lesson', 49, 15, 14),

(@kurs_id, 'threading', '<h2>threading</h2><p>Vlákna pro I/O paralelismus. <code>Thread</code> spustí funkci, <code>Lock</code> chrání sdílená data, <code>Queue</code> pro komunikaci. GIL omezuje CPU paralelismus.</p><pre><code>from threading import Thread, Lock\nimport requests\n\nlock = Lock()\nresults = []\n\ndef fetch(url):\n    r = requests.get(url, timeout=5)\n    with lock:\n        results.append(r.status_code)\n\nthreads = [Thread(target=fetch, args=(u,)) for u in urls]\nfor t in threads: t.start()\nfor t in threads: t.join()</code></pre>', 'lesson', 50, 15, 16),

(@kurs_id, 'subprocess', '<h2>subprocess</h2><p>Spouštění externích procesů. <code>run()</code> pro jednoduché volání, <code>Popen</code> pro plnou kontrolu. Nikdy <code>shell=True</code> s nedůvěryhodným vstupem.</p><pre><code>import subprocess\nr = subprocess.run(\n    ["git", "status"],\n    capture_output=True, text=True\n)\nprint(r.stdout)\n\n# S časovým limitem\nr = subprocess.run(["sleep","1"], timeout=5)</code></pre>', 'lesson', 51, 15, 14),

(@kurs_id, 'logging', '<h2>logging</h2><p>Standardní modul nahrazuje print. Úrovně: DEBUG, INFO, WARNING, ERROR, CRITICAL. Handlery pro soubor i konzoli.</p><pre><code>import logging\nlogging.basicConfig(\n    level=logging.INFO,\n    format="%(asctime)s [%(levelname)s] %(message)s",\n    handlers=[\n        logging.FileHandler("app.log", encoding="utf-8"),\n        logging.StreamHandler()\n    ]\n)\nlogging.info("App started")\nlogging.error("Connection failed")</code></pre>', 'lesson', 52, 15, 14);


-- ============================================================
-- KVÍZ 4: Praktický Python (sort_order 53)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 4 — Praktický Python', '<p>Ověř znalosti Flask, requests, pandas, threading a nástrojů.</p>', 'quiz', 53, 50, 15);

SET @q4 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q4, 'Jak získáš JSON z requests response?', 'response.text', 'response.json()', 'json.loads(response)', 'response.data', 'b', 'Metoda response.json() automaticky parsuje JSON odpověď.', 1),
(@q4, 'Co dělá Flask route @app.route("/api/users")?', 'Vytvoří URL pravidlo pro funkci', 'Importuje modul', 'Definuje třídu', 'Spustí server', 'a', '@app.route spojuje URL cestu s funkcí, která se zavolá při požadavku.', 2),
(@q4, 'Jak vytvoříš DataFrame z CSV?', 'pd.read_csv("f.csv")', 'pd.load("f.csv")', 'DataFrame.from_csv("f")', 'csv.read("f")', 'a', 'pd.read_csv() je standardní metoda pro načtení CSV do DataFrame.', 3),
(@q4, 'Co je GIL v Pythonu?', 'Garbage collector', 'Global Interpreter Lock — omezuje paralelní vlákna', 'Modul pro GUI', 'Zkratka pro globals()', 'b', 'GIL umožňuje pouze jednomu vláknu spouštět Python bytecode najednou.', 4),
(@q4, 'Jak spustíš subprocess a získáš výstup?', 'os.run()', 'subprocess.run(cmd, capture_output=True)', 'exec(cmd)', 'shell(cmd)', 'b', 'subprocess.run() s capture_output=True zachytí stdout i stderr.', 5);


-- ============================================================
-- SEKCE 5: Projekty (sort_order 54-60)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Projekt: CLI Todo aplikace', '<h2>CLI Todo</h2><p>Vytvoř todo aplikaci v terminálu s <code>argparse</code> a uložením do JSON. Příkazy: add, list, done, delete.</p><pre><code>import json, argparse\n\ndef add_task(title):\n    tasks = json.load(open("todos.json")) if Path("todos.json").exists() else []\n    tasks.append({"title": title, "done": False})\n    json.dump(tasks, open("todos.json","w"), ensure_ascii=False)\n\nparser = argparse.ArgumentParser()\nparser.add_argument("cmd", choices=["add","list","done"])\nparser.add_argument("arg", nargs="?")\nargs = parser.parse_args()</code></pre>', 'lesson', 54, 20, 20),

(@kurs_id, 'Projekt: CSV Analyzér', '<h2>CSV Analyzér</h2><p>Načti CSV, spočítej statistiky a vyfiltruj data. Ulož výsledky do nového CSV.</p><pre><code>import pandas as pd\ndf = pd.read_csv("zamestnanci.csv")\nprint(df.describe())\nseniori = df[df["plat"] > 50000]\nseniori.to_csv("seniori.csv", index=False)\nprint(f"Prumer: {df[''plat''].mean():.0f} Kc")</code></pre>', 'lesson', 55, 20, 20),

(@kurs_id, 'Projekt: Flask + SQLite REST API', '<h2>Flask + SQLite API</h2><p>REST API pro správu uživatelů s databází. GET seznam, POST vytvoř, PUT uprav, DELETE smaž.</p><pre><code>from flask import Flask, request, jsonify\nimport sqlite3\napp = Flask(__name__)\n\n@app.route("/users", methods=["GET","POST"])\ndef users():\n    db = sqlite3.connect("app.db")\n    if request.method == "POST":\n        data = request.get_json()\n        db.execute("INSERT INTO users (name) VALUES (?)", (data["name"],))\n        db.commit()\n        return jsonify(data), 201\n    rows = db.execute("SELECT * FROM users").fetchall()\n    return jsonify(rows)</code></pre>', 'lesson', 56, 20, 25),

(@kurs_id, 'Projekt: File Organizer', '<h2>File Organizer</h2><p>Skript, který roztřídí soubory ve složce podle přípony. Použij <code>pathlib</code> a <code>shutil</code>.</p><pre><code>from pathlib import Path\nimport shutil\n\nCATEGORIES = {"Images": {".jpg",".png"}, "Docs": {".pdf",".txt"}, "Code": {".py",".js"}}\n\ndef organize(src):\n    for f in Path(src).iterdir():\n        if f.is_file():\n            for cat, exts in CATEGORIES.items():\n                if f.suffix.lower() in exts:\n                    dest = Path(src) / cat\n                    dest.mkdir(exist_ok=True)\n                    shutil.move(str(f), dest / f.name)\n                    break</code></pre>', 'lesson', 57, 20, 20),

(@kurs_id, 'Projekt: Web Scraper', '<h2>Web Scraper</h2><p>Stáhni data z webu, extrahuj informace a ulož do CSV. Použij <code>requests</code> + <code>BeautifulSoup</code>.</p><pre><code>import csv, requests\nfrom bs4 import BeautifulSoup\n\nr = requests.get("https://quotes.toscrape.com")\nsoup = BeautifulSoup(r.text, "html.parser")\n\nwith open("quotes.csv", "w", newline="", encoding="utf-8") as f:\n    w = csv.writer(f)\n    w.writerow(["author","text"])\n    for q in soup.select(".quote"):\n        author = q.select_one(".author").get_text()\n        text = q.select_one(".text").get_text()\n        w.writerow([author, text])</code></pre>', 'lesson', 58, 20, 20),

(@kurs_id, 'Projekt: Discord bot intro', '<h2>Discord bot</h2><p>Knihovna <code>discord.py</code> pro tvorbu bota. Commands reagují na zprávy, events na události. Potřebuješ Bot Token z Discord Developer Portal.</p><pre><code>import discord\nfrom discord.ext import commands\n\nbot = commands.Bot(command_prefix="!", intents=discord.Intents.default())\n\n@bot.command()\nasync def pozdrav(ctx):\n    await ctx.send(f"Ahoj, {ctx.author.name}!")\n\n@bot.event\nasync def on_ready():\n    print(f"Bot {bot.user} je online!")\n\nbot.run("TVUJ_TOKEN")</code></pre>', 'lesson', 59, 20, 20),

(@kurs_id, 'Python roadmapa', '<h2>Co dál?</h2><p>Webový vývoj: Django, FastAPI. Data Science: scikit-learn, TensorFlow. Automatizace: Celery, Ansible. Vyber si oblast a prohlubuj.</p><pre><code># Doporučené směry:\nweb = ["Django", "FastAPI", "Flask"]\ndata = ["scikit-learn", "TensorFlow", "Jupyter"]\ndevops = ["Docker SDK", "Fabric", "CI/CD"]\n\n# Zdroje:\n# docs.python.org — oficiální dokumentace\n# realpython.com — tutoriály\n# kaggle.com — datové soutěže</code></pre>', 'lesson', 60, 20, 15);


-- ============================================================
-- ZÁVĚREČNÝ KVÍZ (sort_order 61)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Závěrečný kvíz — Celý Python kurz', '<p>Závěrečný test pokrývající všechny sekce kurzu Python.</p>', 'final_quiz', 61, 200, 30);

SET @qfin = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@qfin, 'Co vypíše [x**2 for x in range(4)]?', '[0,1,4,9]', '[1,4,9,16]', '[0,1,2,3]', 'chyba', 'a', 'range(4) = 0,1,2,3 — druhé mocniny jsou 0,1,4,9.', 1),
(@qfin, 'Jaký je výsledek "hello"[1:4]?', 'hell', 'ell', 'ello', 'hel', 'b', 'Řez [1:4] vrací znaky na indexech 1,2,3 = "ell".', 2),
(@qfin, 'Co dělá dict.items()?', 'Vrátí klíče', 'Vrátí hodnoty', 'Vrátí páry (klíč, hodnota)', 'Smaže obsah', 'c', 'dict.items() vrací view dvojic (klíč, hodnota) pro iteraci.', 3),
(@qfin, 'Co je lambda x: x*2?', 'Anonymní funkce', 'Třída', 'Dekorátor', 'Generátor', 'a', 'lambda vytváří anonymní funkci — lambda x: x*2 vrací dvojnásobek.', 4),
(@qfin, 'Jak se ověří typ: isinstance(x, int)?', 'type(x) == int (oba správně)', 'Jen isinstance', 'Jen type() ==', 'Nelze ověřit', 'a', 'isinstance() i type() == fungují, isinstance je preferovaný (respektuje dědičnost).', 5),
(@qfin, 'Co vrátí zip([1,2], ["'a'","'b'"])?', '[(1,"'a'"),(2,"'b'")] jako iterator', '[["1","a"],["2","b"]]', 'chyba', 'None', 'a', 'zip() vrací iterator dvojic — (1,"a"), (2,"b").', 6),
(@qfin, 'Co je *args v def f(*args)?', 'Povinný parametr', 'Tuple všech pozičních argumentů', 'Slovník', 'Výjimka', 'b', '*args sbírá všechny poziční argumenty do tuple.', 7),
(@qfin, 'Jak spustíš async funkci?', 'async.run(f())', 'asyncio.run(f())', 'await f()', 'run(f())', 'b', 'asyncio.run() je standardní způsob spuštění async funkce z kódu.', 8),
(@qfin, 'Co je virtual environment?', 'Cloudové prostředí', 'Izolované Python prostředí s vlastními balíčky', 'Docker kontejner', 'IDE plugin', 'b', 'venv vytvoří izolované prostředí s vlastními balíčky oddělené od globální instalace.', 9),
(@qfin, 'Co vrátí pd.DataFrame({"a":[1,2]}).shape?', '(1,2)', '(2,1)', '[2,1]', '2', 'b', 'DataFrame má 2 řádky a 1 sloupec — shape je (2,1).', 10),
(@qfin, 'Co dělá @staticmethod?', 'Metoda bez přístupu k self nebo cls', 'Třídní metoda', 'Abstraktní metoda', 'Dekorátor pro property', 'a', '@staticmethod definuje metodu, která nepřijímá automaticky instanci (self) ani třídu (cls).', 11),
(@qfin, 'Jak Python pracuje s GIL a vlákny?', 'Plně paralelní', 'GIL blokuje paralelní spuštění Python bytecode — vhodné pro I/O ne CPU', 'Vlákna jsou zakázaná', 'Vlákna jsou rychlejší než procesy', 'b', 'GIL umožňuje jen jednomu vláknu spouštět bytecode — threading je vhodný pro I/O operace.', 12),
(@qfin, 'Co je __name__ == "__main__"?', 'Vždy True', 'True jen když spouštíš soubor přímo', 'Název modulu', 'Podmínka pro debug', 'b', 'Konstrukce zjistí, zda se soubor spouští přímo, nikoliv importem.', 13),
(@qfin, 'Co dělá requests.Session()?', 'Vytvoří nové připojení pokaždé', 'Sdílí cookies a hlavičky přes více requestů', 'Spustí server', 'Cachuje odpovědi', 'b', 'Session udržuje cookies a hlavičky napříč více HTTP požadavky.', 14),
(@qfin, 'Jaký je výstup: print(bool(0), bool([]), bool("0"))?', 'False False False', 'False False True', 'True True True', 'False True False', 'b', '0 a [] jsou falsy, "0" je neprázdný řetězec = truthy. Výsledek: False False True.', 15);


-- ============================================================
-- Aktualizace počtu lekcí
-- ============================================================

UPDATE courses SET lesson_count = (SELECT COUNT(*) FROM lessons WHERE course_id = @kurs_id) WHERE id = @kurs_id;