-- JavaScript kurz — Kompletní kurz (Sekce 1-4 + všechny kvízy + závěrečný kvíz)
-- MariaDB 10.4, phpMyAdmin style, no DELIMITER
-- Apostrofy escapovány jako ''

SET @kurs_id = (SELECT id FROM courses WHERE slug = 'javascript');

-- ============================================================
-- SEKCE 1: Základy JS (sort_order 1-18)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Úvod do JavaScriptu', '<h2>Co je JavaScript</h2><p>JavaScript je jazyk webu — běží v každém prohlížeči i na serveru (Node.js). Vytvořen 1995, dnes ES2024+. Dynamicky typovaný, multiparadigmatický.</p><pre><code>// První program
console.log("Ahoj, VeVit!");

// V prohlížeči
document.body.innerHTML = "&lt;h1&gt;Ahoj!&lt;/h1&gt;";</code></pre><h2>Kde běží JS</h2><ul><li><strong>Prohlížeč</strong> — DOM, události, Fetch API</li><li><strong>Node.js</strong> — server, file system, CLI</li><li><strong>Deno / Bun</strong> — moderní runtime</li></ul>', 'lesson', 1, 15, 10),

(@kurs_id, 'var/let/const', '<h2>Deklarace proměnných</h2><p><code>var</code> — function scope, hoisted. <code>let</code> — block scope, TDZ. <code>const</code> — block scope, nelze reassign. Vždy preferuj <code>const</code>, pak <code>let</code>, nikdy <code>var</code>.</p><pre><code>var x = 1;    // function scope — vyhni se!
let y = 2;    // block scope, lze měnit
const z = 3;  // block scope, nelze měnit

// TDZ — Temporal Dead Zone
console.log(a); // ReferenceError!
let a = 5;

// const objekt lze měnit vnitřně
const user = { name: "Karel" };
user.name = "Jan"; // OK
user = {}; // TypeError!</code></pre>', 'lesson', 2, 15, 10),

(@kurs_id, 'Typy a type coercion', '<h2>Primitivní typy</h2><p><code>string, number, bigint, boolean, undefined, null, symbol</code>. <code>typeof null</code> vrací <code>"object"</code> — historický bug.</p><pre><code>typeof "ahoj"    // "string"
typeof 42        // "number"
typeof true      // "boolean"
typeof undefined  // "undefined"
typeof null       // "object" (bug!)

// == vs ===
"5" == 5    // true  (coercion)
"5" === 5   // false (strict)
null == undefined  // true
null === undefined // false</code></pre><h2>Implicitní konverze</h2><pre><code>"5" + 3     // "53" (string)
"5" - 3     // 2    (number)
!"ahoj"     // false
!!0         // false</code></pre>', 'lesson', 3, 15, 12),

(@kurs_id, 'Operátory', '<h2>Aritmetické a porovnávací</h2><p><code>+ - * / % **</code>, <code>== != === !== &lt; &gt; &lt;= &gt;=</code>.</p><pre><code>2 ** 10     // 1024
17 % 5      // 2</code></pre><h2>Logické a nullish</h2><pre><code>// Logické: && || !
true && false  // false
true || false  // true

// Nullish coalescing (??) — jen null/undefined
const name = null ?? "Anonym";  // "Anonym"
const count = 0 ?? 42;         // 0 (0 není nullish!)

// Optional chaining (?.)
const user = { address: { city: "Praha" } };
user?.address?.city   // "Praha"
user?.phone?.brand    // undefined (no error)</code></pre>', 'lesson', 4, 15, 12),

(@kurs_id, 'Řetězce a template literals', '<h2>Řetězce v JS</h2><p>Neměnné, index od 0. Metody: <code>includes, startsWith, endsWith, repeat, slice, split, trim, replace, replaceAll</code>.</p><pre><code>const s = "VeVit";
s[0];           // "V"
s.includes("Vit");  // true
s.repeat(3);    // "VeVitVeVitVeVit"

// Template literals (backticks)
const name = "Karel";
const age = 25;
console.log(`${name} je ${age} let stary`);
console.log(`2 + 3 = ${2 + 3}`);  // "2 + 3 = 5"</code></pre><h2>Víceřádkové řetězce</h2><pre><code>const html = `
  &lt;div class="card"&gt;
    &lt;h2&gt;${title}&lt;/h2&gt;
  &lt;/div&gt;
`;</code></pre>', 'lesson', 5, 15, 10),

(@kurs_id, 'Pole (metody)', '<h2>Pole v JS</h2><p>Uspořádaná kolekce, dynamická velikost. Základní: <code>push, pop, shift, unshift, splice</code>.</p><pre><code>const arr = [1, 2, 3];
arr.push(4);       // [1,2,3,4]
arr.pop();         // [1,2,3]
arr.unshift(0);    // [0,1,2,3]</code></pre><h2>Funkcionální metody</h2><pre><code>const nums = [1, 2, 3, 4, 5];

nums.map(x => x * 2);       // [2,4,6,8,10]
nums.filter(x => x > 3);    // [4,5]
nums.reduce((s, x) => s + x, 0); // 15
nums.find(x => x > 3);      // 4
nums.some(x => x > 4);      // true
nums.every(x => x > 0);     // true

// Spread a destructuring
const a = [1, 2], b = [3, 4];
const merged = [...a, ...b]; // [1,2,3,4]
const [first, ...rest] = [1,2,3,4]; // first=1, rest=[2,3,4]</code></pre>', 'lesson', 6, 15, 12),

(@kurs_id, 'Objekty', '<h2>Objekty v JS</h2><p>Kolekce klíč–hodnota. Klíče jsou stringy nebo Symboly. Přístup: <code>obj.key</code> nebo <code>obj["key"]</code>.</p><pre><code>const user = {
    name: "Karel",
    age: 25,
    greet() { return `Ahoj, ${this.name}!`; }
};

// Shorthand
const x = 10;
const obj = { x }; // { x: 10 }

// Object methods
Object.keys(user);    // ["name", "age", "greet"]
Object.values(user);  // ["Karel", 25, f]
Object.entries(user); // [["name","Karel"], ...]

// Spread merge
const updated = { ...user, age: 26 };

// Optional chaining
user?.address?.city  // undefined if missing</code></pre>', 'lesson', 7, 15, 12),

(@kurs_id, 'Podmínky', '<h2>if / else if / else</h2><pre><code>const age = 18;
if (age >= 18) {
    console.log("Dospely");
} else if (age >= 15) {
    console.log("Stredni skola");
} else {
    console.log("Zakladni skola");
}</code></pre><h2>switch</h2><pre><code>const day = "po";
switch (day) {
    case "po": case "ut": case "st":
        console.log("Pracovni den"); break;
    case "so": case "ne":
        console.log("Vikend"); break;
    default:
        console.log("Neznamy");
}</code></pre><h2>Ternární operátor</h2><pre><code>const msg = age >= 18 ? "Dospely" : "Neplnolety";

// Nullish coalescing jako podmínka
const name = input ?? "Anonym";</code></pre>', 'lesson', 8, 15, 10),

(@kurs_id, 'Cykly', '<h2>for, while, for...of, for...in</h2><pre><code>// Klasický for
for (let i = 0; i < 5; i++) console.log(i);

// while
let x = 0;
while (x < 5) { x++; }

// for...of — iteruje hodnoty (pole, string)
for (const item of ["a", "b", "c"]) console.log(item);

// for...in — iteruje klíče (objekty)
for (const key in { a: 1, b: 2 }) console.log(key);

// break a continue
for (let i = 0; i < 10; i++) {
    if (i === 3) continue; // přeskočí 3
    if (i === 7) break;    // ukončí cyklus
}</code></pre>', 'lesson', 9, 15, 10),

(@kurs_id, 'Funkce', '<h2>Deklarace vs výraz</h2><pre><code>// Function declaration (hoisted)
greet("Karel");
function greet(name) { return `Ahoj, ${name}!`; }

// Function expression (NOT hoisted)
const greet2 = function(name) { return `Ahoj, ${name}!`; };

// Arrow function
const greet3 = (name) => `Ahoj, ${name}!`;
const double = x => x * 2; // jeden param, implicit return</code></pre><h2>Default a rest parametry</h2><pre><code>function greet(name = "Anonym") { return `Ahoj, ${name}!`; }
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }
sum(1, 2, 3); // 6</code></pre><h2>IIFE</h2><pre><code>(function() {
    const secret = "hidden";
    console.log(secret);
})();</code></pre>', 'lesson', 10, 15, 12),

(@kurs_id, 'DOM základy', '<h2>Výběr elementů</h2><pre><code>document.querySelector(".card");      // první .card
document.querySelectorAll(".card");   // všechny .card
document.getElementById("app");       // podle ID</code></pre><h2>Manipulace</h2><pre><code>const el = document.querySelector("#title");
el.textContent = "Novy nadpis";      // bezpečné (text)
el.innerHTML = "&lt;b&gt;Bold&lt;/b&gt;";      // HTML (pozor na XSS!)

// Třídy
el.classList.add("active");
el.classList.remove("hidden");
el.classList.toggle("dark");
el.classList.contains("active"); // true/false

// Styly
el.style.color = "#10b981";
el.style.fontSize = "1.5rem";</code></pre>', 'lesson', 11, 15, 12),

(@kurs_id, 'Events a addEventListener', '<h2>Naslouchání událostí</h2><pre><code>const btn = document.querySelector("#btn");
btn.addEventListener("click", (e) => {
    console.log("Klik!", e.target);
});

// Input event
input.addEventListener("input", (e) => {
    console.log(e.target.value);
});

// Submit form
form.addEventListener("submit", (e) => {
    e.preventDefault(); // zabrání reloadu
    const data = new FormData(form);
});</code></pre><h2>Event delegation</h2><pre><code>// Jeden listener na parent místo mnoha na děti
document.querySelector("#list").addEventListener("click", (e) => {
    const item = e.target.closest("li");
    if (item) item.classList.toggle("done");
});</code></pre>', 'lesson', 12, 15, 12),

(@kurs_id, 'Fetch API + async/await', '<h2>Fetch API</h2><pre><code>// .then/.catch
fetch("/api/users")
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.error(err));

// async/await (preferováno)
async function loadUsers() {
    try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log(data);
    } catch (err) {
        console.error("Chyba:", err);
    }
}</code></pre><h2>POST request</h2><pre><code>const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson_id: 1, xp: 10 })
});</code></pre>', 'lesson', 13, 15, 15),

(@kurs_id, 'Promises', '<h2>Promise základy</h2><pre><code>const p = new Promise((resolve, reject) => {
    setTimeout(() => resolve("Hotovo!"), 1000);
});

p.then(val => console.log(val))   // "Hotovo!"
 .catch(err => console.error(err))
 .finally(() => console.log("Konec"));</code></pre><h2>Kombinace</h2><pre><code>// Promise.all — čeká na všechny
const [users, courses] = await Promise.all([
    fetch("/api/users").then(r => r.json()),
    fetch("/api/courses").then(r => r.json())
]);

// Promise.race — první dokončený
const fastest = await Promise.race([p1, p2]);

// Promise.allSettled — výsledky i chyb
const results = await Promise.allSettled([p1, p2, p3]);</code></pre>', 'lesson', 14, 15, 15),

(@kurs_id, 'localStorage', '<h2>Ukládání dat</h2><pre><code>// Set/Get/Remove
localStorage.setItem("theme", "dark");
const theme = localStorage.getItem("theme"); // "dark"
localStorage.removeItem("theme");
localStorage.clear(); // smaže vše

// Objekty a pole — musíš serializovat
const user = { name: "Karel", xp: 150 };
localStorage.setItem("user", JSON.stringify(user));
const loaded = JSON.parse(localStorage.getItem("user"));

// sessionStorage — smaže se při zavření tabu
sessionStorage.setItem("temp", "data");</code></pre><h2>Praktický příklad — dark mode</h2><pre><code>function setTheme(theme) {
    localStorage.setItem("vevit-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
}
const saved = localStorage.getItem("vevit-theme") || "dark";
setTheme(saved);</code></pre>', 'lesson', 15, 15, 10),

(@kurs_id, 'Error handling try/catch', '<h2>Zachycení chyb</h2><pre><code>try {
    const data = JSON.parse("neplatny json");
} catch (err) {
    console.error(err.name);    // "SyntaxError"
    console.error(err.message); // "Unexpected token..."
} finally {
    console.log("Vždy se provede");
}</code></pre><h2>Typy chyb</h2><pre><code>ReferenceError: x is not defined
TypeError: null is not an object
SyntaxError: unexpected token
RangeError: Maximum call stack size exceeded</code></pre><h2>Custom Error</h2><pre><code>class VeVitError extends Error {
    constructor(message, code) {
        super(message);
        this.name = "VeVitError";
        this.code = code;
    }
}
throw new VeVitError("XP nelze záporné", "NEGATIVE_XP");</code></pre>', 'lesson', 16, 15, 12),

(@kurs_id, 'ES6 moduly (import/export)', '<h2>Export a import</h2><pre><code>// math.js — named export
export function add(a, b) { return a + b; }
export const PI = 3.14;

// app.js — named import
import { add, PI } from "./math.js";

// Default export (jedna na soubor)
export default class User { ... }
import User from "./user.js";

// Dynamic import
const module = await import("./heavy-module.js");</code></pre><h2>script type="module"</h2><pre><code>&lt;script type="module" src="js/app.js"&gt;&lt;/script&gt;</code></pre><p>Moduly jsou vždy <code>strict mode</code>, <code>defer</code> automaticky, mají vlastní scope.</p>', 'lesson', 17, 15, 10),

(@kurs_id, 'Classes', '<h2>Třídy v JS</h2><pre><code>class User {
    constructor(name, xp) {
        this.name = name;
        this.xp = xp;
    }
    get level() { return Math.floor(this.xp / 100); }
    addXp(amount) { this.xp += amount; }
    static fromJSON(json) { return new User(json.name, json.xp); }
}

class Admin extends User {
    constructor(name, xp) {
        super(name, xp);
        this.role = "admin";
    }
}

const u = User.fromJSON({ name: "Karel", xp: 250 });
console.log(u.level); // 2</code></pre><h2>Getters/Setters</h2><pre><code>class ProgressBar {
    #percent = 0; // private field
    set percent(v) { this.#percent = Math.max(0, Math.min(100, v)); }
    get percent() { return this.#percent; }
}</code></pre>', 'lesson', 18, 15, 15);


-- ============================================================
-- KVÍZ 1: Základy JS (sort_order 19)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 1 — Základy JavaScriptu', '<p>Ověř znalosti proměnných, typů, funkcí a DOM.</p>', 'quiz', 19, 50, 15);

SET @q1 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q1, 'Jaký je rozdíl mezi let a const?', 'let je block scope, const není', 'const nelze reassign, let ano', 'Jsou stejné', 'const je jen pro čísla', 'b', 'const nelze přiřadit novou hodnotu (reassign), ale objekty uvnitř const lze měnit.', 1),
(@q1, 'Co vypíše typeof null?', '"null"', '"undefined"', '"object"', '"boolean"', 'c', 'typeof null vrací "object" — jedná se o historický bug v JavaScriptu.', 2),
(@q1, 'Co je výsledek "5" + 3?', '"53"', '8', 'NaN', 'chyba', 'a', 'Operátor + s řetězcem provede string concatenation — "5" + 3 = "53".', 3),
(@q1, 'Co dělá e.preventDefault()?', 'Zastaví šíření události', 'Zabrání výchozí akci prohlížeče', 'Smaže element', 'Zastaví cyklus', 'b', 'preventDefault() zabrání výchozímu chování (např. odeslání formuláře, navigace odkazu).', 4),
(@q1, 'Jaký je rozdíl mezi == a ===?', 'Žádný', '== porovnává typy, === hodnoty', '== provádí coercion, === ne', '=== je pomalejší', 'c', '== provádí type coercion (převede typy), === porovnává bez konverze (strict equality).', 5),
(@q1, 'Co vrací querySelectorAll?', 'Jeden element', 'Pole elementů (NodeList)', 'HTMLCollection', 'String', 'b', 'querySelectorAll vrací NodeList — pole-like kolekci všech odpovídajících elementů.', 6),
(@q1, 'Co je arrow function?', 'Funkce s vlastním this', 'Stručná syntaxe funkce bez vlastního this', 'Třída', 'Generator', 'b', 'Arrow function nemá vlastní this — dědí this z okolního scope.', 7),
(@q1, 'Co dělá JSON.parse()?', 'Převede objekt na řetězec', 'Převede JSON řetězec na objekt', 'Ověří JSON', 'Smaže JSON', 'b', 'JSON.parse() deserializuje JSON řetězec zpět na JavaScript objekt/pole.', 8),
(@q1, 'Co je event delegation?', 'Nasazení listenerů na každý element', 'Jeden listener na parent element', 'Zrušení události', 'Delegování události na server', 'b', 'Event delegation = jeden listener na rodiče, který zpracuje události z dětí pomocí e.target.', 9),
(@q1, 'Co vypíše console.log(0 ?? 42)?', '0', '42', 'null', 'undefined', 'a', '?? (nullish coalescing) vrátí pravou stranu jen pro null/undefined. 0 není nullish, tak vrací 0.', 10);


-- ============================================================
-- SEKCE 2: Pokročilý JS (sort_order 20-31)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Closures', '<h2>Closure</h2><p>Funkce si pamatuje proměnné z scope, ve kterém byla vytvořena — i když scope už skončil.</p><pre><code>function makeCounter() {
    let count = 0;
    return () => ++count;
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3</code></pre><h2>Praktické použití</h2><pre><code>// Factory funkce
function makeXPTracker(initial) {
    let xp = initial;
    return {
        add: (n) => { xp += n; },
        get: () => xp
    };
}
const tracker = makeXPTracker(0);
tracker.add(50);
tracker.get(); // 50</code></pre><p>Pozor na memory leaks — closure drží reference na celý vnější scope.</p>', 'lesson', 20, 20, 15),

(@kurs_id, 'Prototypový řetězec', '<h2>Prototypy</h2><p>JS nepoužívá třídy jako OOP jazyky — používá prototypovou dědičnost. Každý objekt má <code>__proto__</code> odkazující na prototyp.</p><pre><code>const animal = { speak() { return "Zvuk"; } };
const dog = Object.create(animal);
dog.speak(); // "Zvuk" — hledá v prototypu

// Řetězec: dog → animal → Object.prototype → null
dog.hasOwnProperty("speak"); // false
animal.hasOwnProperty("speak"); // true</code></pre><h2>Constructor pattern</h2><pre><code>function User(name) {
    this.name = name;
}
User.prototype.greet = function() { return `Ahoj, ${this.name}!`; };
const u = new User("Karel");
u.greet(); // "Ahoj, Karel!"</code></pre>', 'lesson', 21, 20, 15),

(@kurs_id, 'Generátory a iterátory', '<h2>Generátory</h2><p><code>function*</code> vytvoří generátor. <code>yield</code> pozastaví funkci a vrátí hodnotu.</p><pre><code>function* range(start, end) {
    for (let i = start; i < end; i++) yield i;
}
for (const n of range(0, 5)) console.log(n); // 0 1 2 3 4

// Ruční iterace
const gen = range(0, 3);
gen.next(); // { value: 0, done: false }
gen.next(); // { value: 1, done: false }
gen.next(); // { value: 2, done: false }
gen.next(); // { value: undefined, done: true }</code></pre><h2>Symbol.iterator</h2><pre><code>const obj = {
    data: [1, 2, 3],
    [Symbol.iterator]() {
        let i = 0;
        return { next: () => ({ value: this.data[i++], done: i > this.data.length }) };
    }
};
[...obj]; // [1, 2, 3]</code></pre>', 'lesson', 22, 20, 15),

(@kurs_id, 'Symbol + WeakMap + WeakRef', '<h2>Symbol</h2><p>Unikátní identifikátor — nikdy se neopakuje. Užitečný pro skryté vlastnosti objektů.</p><pre><code>const id = Symbol("user-id");
const user = { [id]: 123, name: "Karel" };
Object.keys(user); // ["name"] — Symbol je skrytý
user[id]; // 123</code></pre><h2>WeakMap</h2><p>Klíče musí být objekty, nezabrání GC. Ideální pro privátní data.</p><pre><code>const privateData = new WeakMap();
class User {
    constructor(name) {
        privateData.set(this, { name });
    }
    get name() { return privateData.get(this).name; }
}</code></pre><h2>WeakRef</h2><pre><code>let obj = { data: "velka data" };
const ref = new WeakRef(obj);
ref.deref(); // { data: "velka data" }
obj = null; // GC může smazat
ref.deref(); // undefined (po GC)</code></pre>', 'lesson', 23, 20, 15),

(@kurs_id, 'Proxy + Reflect', '<h2>Proxy</h2><p>Proxy obaluje objekt a zachycuje (traps) operace jako čtení, zápis, mazání.</p><pre><code>const user = { name: "Karel", xp: 100 };
const proxy = new Proxy(user, {
    get(target, prop) {
        console.log(`Cteni: ${prop}`);
        return Reflect.get(target, prop);
    },
    set(target, prop, value) {
        if (prop === "xp" && value < 0) throw new Error("XP nemuze byt zaporne!");
        Reflect.set(target, prop, value);
        return true;
    }
});
proxy.name;  // "Cteni: name" → "Karel"
proxy.xp = -5; // Error!</code></pre><h2>Revocable proxy</h2><pre><code>const { proxy, revoke } = Proxy.revocable(target, handler);
revoke(); // proxy přestane fungovat — TypeError</code></pre>', 'lesson', 24, 20, 15),

(@kurs_id, 'Destructuring pokročile', '<h2>Nested a default</h2><pre><code>const { address: { city } = {} } = user; // safe destructuring

// Přeskakování v polích
const [, , third] = [1, 2, 3, 4]; // third = 3

// Swap bez temp proměnné
let a = 1, b = 2;
[a, b] = [b, a]; // a=2, b=1

// Rest v destructuring
const { name, ...rest } = { name: "Karel", age: 25, xp: 100 };

// Funkční parametry
function render({ title, items = [] }) {
    console.log(title, items);
}
render({ title: "Kurzy" }); // items = []</code></pre>', 'lesson', 25, 20, 12),

(@kurs_id, 'Map + Set', '<h2>Map</h2><p>Stejně jako Object, ale klíče mohou být jakéhokoliv typu. Udržuje pořadí vložení.</p><pre><code>const m = new Map();
m.set("name", "Karel");
m.set(42, "odpoved");
m.set({ obj: true }, "objektovy klic");

m.get("name"); // "Karel"
m.has(42);     // true
m.size;        // 3

// Iterace
for (const [key, val] of m) console.log(key, val);</code></pre><h2>Set</h2><pre><code>const s = new Set([1, 2, 2, 3]);
s; // Set {1, 2, 3} — unikátní hodnoty
s.add(4);
s.has(2); // true
s.delete(1);

// Odstranění duplikátů z pole
const unique = [...new Set([1,1,2,2,3])]; // [1,2,3]</code></pre>', 'lesson', 26, 20, 12),

(@kurs_id, 'Regex', '<h2>RegExp v JS</h2><pre><code>// Vytvoření
const re = /vevit/i; // flagy: g(global), i(ignore case), m(multiline)

// Test
/vevit/i.test("VeVit Edu"); // true

// Exec — detailní výsledky
const match = /(\w+)@(\w+)/.exec("user@vevit");
match[1]; // "user"
match[2]; // "vevit"</code></pre><h2>Replace s funkcí</h2><pre><code>"a1b2c3".replace(/\d/g, d => `[${d}]`); // "a[1]b[2]c[3]"</code></pre><h2>Named groups</h2><pre><code>const re2 = /(?&lt;year&gt;\d{4})-(?&lt;month&gt;\d{2})/;
const { year, month } = re2.exec("2026-04").groups;</code></pre>', 'lesson', 27, 20, 15),

(@kurs_id, 'Date + Intl API', '<h2>Date objekt</h2><pre><code>const now = new Date();
now.getFullYear();  // 2026
now.getMonth();     // 0-11!
now.getDate();      // 1-31

// Timestamp
Date.now(); // ms od 1.1.1970

// Parsování (pozor na formát!)
new Date("2026-04-12"); // OK
new Date("12.4.2026");  // Invalid v některých prohlížečích</code></pre><h2>Intl API</h2><pre><code>// Formátování data
new Intl.DateTimeFormat("cs-CZ", { dateStyle: "long" })
    .format(now); // "12. dubna 2026"

// Formátování čísel
new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK" })
    .format(1234.5); // "1 234,50 Kč"

// Relativní čas
new Intl.RelativeTimeFormat("cs-CZ", { numeric: "auto" })
    .format(-1, "day"); // "včera"</code></pre>', 'lesson', 28, 20, 15),

(@kurs_id, 'Funkcionální programování', '<h2>Pure funkce</h2><p>Same input → same output, žádné side effects. Snazší testování a reasoning.</p><pre><code>// Pure
const double = x => x * 2;

// Impure — side effect
let total = 0;
const addToTotal = x => { total += x; return total; };</code></pre><h2>Pipe a compose</h2><pre><code>const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const trim = s => s.trim();
const lower = s => s.toLowerCase();
const capitalize = s => s[0].toUpperCase() + s.slice(1);

const formatName = pipe(trim, lower, capitalize);
formatName("  kaREL  "); // "Karel"</code></pre><h2>Currying</h2><pre><code>const add = a => b => a + b;
const add5 = add(5);
add5(3); // 8</code></pre>', 'lesson', 29, 20, 15),

(@kurs_id, 'Debounce + throttle + rAF', '<h2>Debounce</h2><p>Počká, až uživatel přestane psát, pak zavolá funkci. Ideální pro search input.</p><pre><code>function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
input.addEventListener("input", debounce(e => {
    search(e.target.value);
}, 250));</code></pre><h2>Throttle</h2><p>Zavolá funkci maximálně jednou za X ms. Pro scroll/resize.</p><pre><code>function throttle(fn, ms = 100) {
    let last = 0;
    return (...args) => {
        const now = Date.now();
        if (now - last >= ms) { last = now; fn(...args); }
    };
}</code></pre><h2>requestAnimationFrame</h2><pre><code>function animate() {
    // aktualizace + render
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);</code></pre>', 'lesson', 30, 20, 15),

(@kurs_id, 'IndexedDB', '<h2>IndexedDB — client-side databáze</h2><p>Ukládá velké strukturované data v prohlížeči. Asynchronní, transakční, podporuje indexy.</p><pre><code>function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open("VevitDB", 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("progress")) {
                const store = db.createObjectStore("progress", { keyPath: "id" });
                store.createIndex("userId", "user_id");
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

// Přidání záznamu
async function saveProgress(data) {
    const db = await openDB();
    const tx = db.transaction("progress", "readwrite");
    tx.objectStore("progress").put(data);
    await new Promise(r => { tx.oncomplete = r; });
}</code></pre>', 'lesson', 31, 20, 18);


-- ============================================================
-- KVÍZ 2: Pokročilý JS (sort_order 32)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 2 — Pokročilý JavaScript', '<p>Ověř znalosti closures, prototypů, generátorů a funkcionálního programování.</p>', 'quiz', 32, 50, 15);

SET @q2 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q2, 'Co je closure?', 'Funkce, která se sama volá', 'Funkce, která si pamatuje svůj lexikální scope', 'Privátní metoda třídy', 'Typ proměnné', 'b', 'Closure je funkce, která si uchovává přístup k proměnným z vnějšího scope, i když tento scope už skončil.', 1),
(@q2, 'Kam směřuje __proto__ nového objektu?', 'Na null', 'Na Object.prototype', 'Na prototyp konstruktoru', 'Na window', 'c', '__proto__ nového objektu (vytvořeného přes new) odkazuje na Constructor.prototype.', 2),
(@q2, 'Co dělá yield v generátoru?', 'Ukončí generátor', 'Vrátí hodnotu a pozastaví generátor', 'Vyhodí výjimku', 'Přeskočí iteraci', 'b', 'yield vrátí hodnotu volajícímu a pozastaví provádění generátoru — při dalším next() pokračuje.', 3),
(@q2, 'Proč použít WeakMap místo Map?', 'WeakMap je rychlejší', 'Klíče mohou být garbage collectovány', 'WeakMap podporuje iteraci', 'WeakMap ukládá více dat', 'b', 'WeakMap nebrání garbage collectoru smazat klíčové objekty — vhodné pro privátní data bez memory leaků.', 4),
(@q2, 'Co zachycuje Proxy?', 'Pouze čtení vlastností', 'Operace jako get, set, delete a další', 'Pouze volání funkcí', 'Pouze DOM události', 'b', 'Proxy může zachytit (trap) mnoho operací: get, set, delete, has, ownKeys, apply, construct aj.', 5),
(@q2, 'Co vrací [...new Set([1,1,2,3])]?', '[1,1,2,3]', '[1,2,3]', 'Set{1,2,3}', 'Chyba', 'b', 'Set odstraní duplikáty, spread (...) převede Set zpět na pole: [1,2,3].', 6),
(@q2, 'Co je pipe v funkcionálním programování?', 'Souborový stream', 'Skládání funkcí zleva doprava', 'Typ Promise', 'Smyčka', 'b', 'Pipe = kompozice funkcí zleva doprava: pipe(f, g)(x) = g(f(x)).', 7),
(@q2, 'Co dělá debounce?', 'Zavolá funkci okamžitě', 'Počká na konec sekvence událostí, pak zavolá', 'Omezí frekvenci volání', 'Zruší funkci', 'b', 'Debounce počká, až události přestanou přicházet (např. uživatel přestane psát), pak zavolá funkci jednou.', 8),
(@q2, 'Jaký formát vrací Intl.DateTimeFormat("cs-CZ")?', 'ISO 8601', 'Český formát data', 'Unix timestamp', 'RFC 2822', 'b', 'Intl.DateTimeFormat formátuje datum podle locale — pro cs-CZ např. "12.4.2026".', 9),
(@q2, 'Jak otevřít IndexedDB databázi?', 'indexedDB.connect()', 'indexedDB.open()', 'new IndexedDB()', 'IndexedDB.init()', 'b', 'indexedDB.open(name, version) otevře nebo vytvoří databázi — vrací IDBRequest s onsuccess/onerror.', 10);


-- ============================================================
-- SEKCE 3: Browser APIs (sort_order 33-42)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Intersection Observer', '<h2>Intersection Observer</h2><p>Sleduje, kdy element vstoupí/vystoupí z viewportu. Efektivnější než scroll event.</p><pre><code>const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // jednorázově
        }
    });
}, { threshold: 0.1, rootMargin: "50px" });

document.querySelectorAll(".card").forEach(el => observer.observe(el));</code></pre><h2>Lazy loading obrázků</h2><pre><code>&lt;img data-src="image.jpg" class="lazy"&gt;
&lt;script&gt;
const imgObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.src = e.target.dataset.src;
            imgObs.unobserve(e.target);
        }
    });
});
document.querySelectorAll("img.lazy").forEach(img => imgObs.observe(img));
&lt;/script&gt;</code></pre>', 'lesson', 33, 20, 15),

(@kurs_id, 'Service Workers + PWA', '<h2>Service Worker</h2><p>Skript běžící na pozadí — zpracovává fetch, push, sync. Umožňuje offline chod.</p><pre><code>// registrace
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
}

// sw.js — cache first
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open("v1").then(c => c.addAll(["/", "/css/style.css", "/js/app.js"]))
    );
});
self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});</code></pre><h2>PWA manifest</h2><pre><code>&lt;link rel="manifest" href="/manifest.json"&gt;
// manifest.json
{
    "name": "VeVit Edu",
    "start_url": "/",
    "display": "standalone",
    "theme_color": "#10b981"
}</code></pre>', 'lesson', 34, 20, 18),

(@kurs_id, 'Canvas API', '<h2>Kreslení na Canvas</h2><pre><code>const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

// Obdélník
ctx.fillStyle = "#10b981";
ctx.fillRect(10, 10, 100, 50);

// Text
ctx.font = "20px Sora";
ctx.fillText("VeVit", 50, 100);

// Animace
let x = 0;
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(x, 50, 30, 30);
    x = (x + 2) % canvas.width;
    requestAnimationFrame(draw);
}
draw();</code></pre>', 'lesson', 35, 20, 15),

(@kurs_id, 'Web Workers', '<h2>Web Worker</h2><p>Beží v odděleném vlákně — neblokuje UI. Komunikace přes postMessage.</p><pre><code>// main.js
const worker = new Worker("worker.js");
worker.postMessage({ data: [1, 2, 3, 4, 5] });
worker.onmessage = (e) => console.log("Výsledek:", e.data);

// worker.js
self.onmessage = (e) => {
    const result = e.data.data.reduce((s, n) => s + n ** 2, 0);
    self.postMessage(result);
};</code></pre><h2>Transferable objects</h2><pre><code>// Přenos ArrayBuffer bez kopírování
worker.postMessage(buffer, [buffer]);</code></pre>', 'lesson', 36, 20, 15),

(@kurs_id, 'Clipboard + Notifications + Geolocation', '<h2>Clipboard API</h2><pre><code>// Kopírovat
await navigator.clipboard.writeText("https://edu.vevit.fun");
// Číst
const text = await navigator.clipboard.readText();</code></pre><h2>Notifications</h2><pre><code>const perm = await Notification.requestPermission();
if (perm === "granted") {
    new Notification("VeVit", { body: "Získal jsi 50 XP!", icon: "/icon.png" });
}</code></pre><h2>Geolocation</h2><pre><code>navigator.geolocation.getCurrentPosition(
    (pos) => console.log(pos.coords.latitude, pos.coords.longitude),
    (err) => console.error(err),
    { enableHighAccuracy: true }
);</code></pre>', 'lesson', 37, 20, 12),

(@kurs_id, 'FormData + validace', '<h2>FormData</h2><pre><code>form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    // Iterace
    for (const [key, val] of data) console.log(key, val);
    // Odeslání
    fetch("/api/save", { method: "POST", body: data });
});</code></pre><h2>Constraint Validation API</h2><pre><code>input.setCustomValidity("Heslo musi mit 8 znaku!");
input.reportValidity(); // zobrazí chybu

// Validace celého formuláře
if (form.checkValidity()) {
    form.submit();
} else {
    form.reportValidity();
}

// Custom validace
input.addEventListener("input", () => {
    if (input.value.length < 8) {
        input.setCustomValidity("Minimalne 8 znaku!");
    } else {
        input.setCustomValidity(""); // zruš chybu
    }
});</code></pre>', 'lesson', 38, 20, 12),

(@kurs_id, 'Tailwind + JS patterns', '<h2>Dynamické třídy</h2><pre><code>// Podmíněné třídy
const cls = `px-4 py-2 rounded-lg ${
    isActive ? "bg-accent text-white" : "bg-gray-100 text-gray-700"
}`;

// Dark mode toggle
function toggleTheme() {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme",
        document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
}</code></pre><h2>State-driven UI</h2><pre><code>const state = { filter: "all", courses: [] };

function render() {
    const filtered = state.filter === "all"
        ? state.courses
        : state.courses.filter(c => c.difficulty === state.filter);
    app.innerHTML = filtered.map(courseCard).join("");
}

// Změna stavu → rerender
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        state.filter = btn.dataset.filter;
        render();
    });
});</code></pre>', 'lesson', 39, 20, 15),

(@kurs_id, 'Jest testování', '<h2>Základní test</h2><pre><code>// math.test.js
const { add, multiply } = require("./math");

describe("Math utils", () => {
    test("add sečte dvě čísla", () => {
        expect(add(2, 3)).toBe(5);
    });
    test("multiply vynásobí", () => {
        expect(multiply(3, 4)).toBe(12);
    });
});</code></pre><h2>Mock funkce</h2><pre><code>test("fetch users", async () => {
    const mockFetch = jest.fn(() =>
        Promise.resolve({ json: () => Promise.resolve([{ id: 1 }]) })
    );
    global.fetch = mockFetch;
    const users = await loadUsers();
    expect(users).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/users");
});</code></pre>', 'lesson', 40, 20, 15),

(@kurs_id, 'TypeScript přechod', '<h2>Typové anotace</h2><pre><code>// Z .js na .ts postupně
interface User {
    name: string;
    xp: number;
    level?: number; // optional
}

function getLevel(user: User): string {
    if (user.xp >= 1000) return "Expert";
    if (user.xp >= 500) return "Pokrocily";
    return "Zacatecnik";
}

// Generics
function first&lt;T&gt;(arr: T[]): T | undefined {
    return arr[0];
}</code></pre><h2>Postupná migrace</h2><pre><code>// tsconfig.json — allowJS pro postupný přechod
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "allowJs": true,
        "strict": false, // postupně zapni
        "outDir": "./dist"
    },
    "include": ["src/**/*"]
}</code></pre>', 'lesson', 41, 20, 15),

(@kurs_id, 'Node.js + Express intro', '<h2>Node.js základy</h2><pre><code>// CommonJS
const http = require("http");
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
});
server.listen(3000);

// ESM (package.json: "type": "module")
import express from "express";</code></pre><h2>Express server</h2><pre><code>import express from "express";
const app = express();

app.use(express.json()); // middleware

app.get("/api/courses", (req, res) => {
    res.json([{ id: 1, title: "Python" }]);
});

app.post("/api/progress", (req, res) => {
    const { user_id, lesson_id, xp } = req.body;
    // uložit do DB...
    res.json({ success: true });
});

app.listen(3000, () => console.log("Server na portu 3000"));</code></pre>', 'lesson', 42, 20, 18);


-- ============================================================
-- KVÍZ 3: Browser APIs (sort_order 43)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 3 — Browser APIs', '<p>Ověř znalosti Intersection Observer, Service Workers, Canvas a dalších browser API.</p>', 'quiz', 43, 50, 10);

SET @q3 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q3, 'K čemu slouží Intersection Observer?', 'K animaci CSS', 'K detekci viditelnosti elementu v viewportu', 'K vytváření DOM elementů', 'K sledování myši', 'b', 'Intersection Observer detekuje, kdy element vstoupí nebo vystoupí z viewportu — efektivnější než scroll event.', 1),
(@q3, 'Co umožňuje Service Worker?', 'Přístup k DOM', 'Offline chod a cacheování požadavků', 'Přímý přístup k souborovému systému', 'Spouštění Python kódu', 'b', 'Service Worker zpracovává fetch události a může cacheovat odpovědi — umožňuje offline přístup (PWA).', 2),
(@q3, 'Jak získáš 2D kontext Canvasu?', 'canvas.getContext("2d")', 'canvas.get2D()', 'canvas.createContext()', 'canvas.draw2D()', 'a', 'canvas.getContext("2d") vrací objekt pro kreslení 2D grafiky na Canvas element.', 3),
(@q3, 'Jak komunikuje Web Worker s hlavním vláknem?', 'Přes globální proměnné', 'Přes postMessage/onmessage', 'Přes DOM', 'Přes localStorage', 'b', 'Web Worker komunikuje s hlavním vláknem asynchronně přes postMessage() a onmessage event.', 4),
(@q3, 'Co vrací navigator.geolocation.getCurrentPosition()?', 'Souřadnice', 'Promise (při úspěchu callback s Position objektem)', 'String', 'HTMLElement', 'b', 'getCurrentPosition přijímá callback funkci, která dostane Position objekt s coords (latitude, longitude).', 5);


-- ============================================================
-- SEKCE 4: Projekty (sort_order 44-60)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Todo app (DOM + localStorage)', '<h2>Projekt: Todo aplikace</h2><p>CRUD aplikace s dynamickým DOM a localStorage persistencí.</p><pre><code>const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");

let todos = JSON.parse(localStorage.getItem("todos") || "[]");

function save() { localStorage.setItem("todos", JSON.stringify(todos)); }

function render() {
    list.innerHTML = todos.map((t, i) => `
        &lt;div class="flex items-center gap-3 p-3 rounded-lg bg-[#161616] border border-[rgba(255,255,255,0.06)]"&gt;
            &lt;input type="checkbox" ${t.done ? "checked" : ""} data-i="${i}" class="todo-check"&gt;
            &lt;span class="${t.done ? ''line-through text-[#6b7280]'' : ''text-white''}"&gt;${t.text}&lt;/span&gt;
            &lt;button data-i="${i}" class="todo-del ml-auto text-red-400 hover:text-red-300"&gt;✕&lt;/button&gt;
        &lt;/div&gt;
    `).join("");
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    todos.push({ text: input.value, done: false });
    input.value = "";
    save(); render();
});

list.addEventListener("click", (e) => {
    const i = e.target.dataset.i;
    if (e.target.classList.contains("todo-check")) { todos[i].done = !todos[i].done; }
    if (e.target.classList.contains("todo-del")) { todos.splice(i, 1); }
    save(); render();
});

render();</code></pre>', 'lesson', 44, 25, 25),

(@kurs_id, 'GitHub profile viewer (Fetch)', '<h2>Projekt: GitHub profil</h2><pre><code>async function loadProfile(username) {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) throw new Error("Uzivatel nenalezen");
    const user = await res.json();

    app.innerHTML = `
        &lt;div class="flex items-center gap-4 p-6 rounded-xl bg-[#161616] border border-[rgba(255,255,255,0.06)]"&gt;
            &lt;img src="${user.avatar_url}" class="w-16 h-16 rounded-full"&gt;
            &lt;div&gt;
                &lt;h2 class="text-xl font-bold text-white"&gt;${user.name || user.login}&lt;/h2&gt;
                &lt;p class="text-sm text-[#6b7280]"&gt;${user.bio || "Bez popisu"}&lt;/p&gt;
                &lt;div class="flex gap-4 mt-2 text-xs text-[#6b7280]"&gt;
                    &lt;span&gt;📦 ${user.public_repos} repozitářů&lt;/span&gt;
                    &lt;span&gt;👥 ${user.followers} followerů&lt;/span&gt;
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    `;
}</code></pre>', 'lesson', 45, 25, 20),

(@kurs_id, 'Kalkulačka (třídy)', '<h2>Projekt: OOP kalkulačka</h2><pre><code>class Calculator {
    #display = "0";
    #prev = null;
    #op = null;

    get display() { return this.#display; }

    input(val) {
        this.#display = this.#display === "0" ? val : this.#display + val;
    }
    operator(op) {
        this.#prev = parseFloat(this.#display);
        this.#op = op;
        this.#display = "0";
    }
    equals() {
        const curr = parseFloat(this.#display);
        const ops = { "+": (a,b) => a+b, "-": (a,b) => a-b, "*": (a,b) => a*b, "/": (a,b) => b===0?"Error":a/b };
        this.#display = String(ops[this.#op]?.(this.#prev, curr) ?? curr);
        this.#prev = null; this.#op = null;
    }
    clear() { this.#display = "0"; this.#prev = null; this.#op = null; }
}

const calc = new Calculator();</code></pre>', 'lesson', 46, 25, 20),

(@kurs_id, 'Real-time chat (WebSockets)', '<h2>WebSocket chat</h2><pre><code>const ws = new WebSocket("wss://chat.vevit.fun/ws");
const messages = [];

ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    messages.push(msg);
    renderMessages();
};

function send(text) {
    ws.send(JSON.stringify({ type: "msg", text, user: "Karel" }));
}

function renderMessages() {
    document.querySelector("#chat").innerHTML = messages.map(m =>
        `&lt;div class="p-2 rounded-lg ${m.user === ''Karel'' ? ''ml-8 bg-accent/10'' : ''mr-8 bg-[#1e1e1e]''}"&gt;
            &lt;span class="text-xs font-bold text-accent"&gt;${m.user}&lt;/span&gt;
            &lt;p class="text-sm text-white"&gt;${m.text}&lt;/p&gt;
        &lt;/div&gt;`
    ).join("");
}</code></pre>', 'lesson', 47, 25, 20),

(@kurs_id, 'Drag & Drop', '<h2>HTML5 Drag and Drop</h2><pre><code>const items = document.querySelectorAll("[draggable=true]");
const dropZone = document.querySelector("#drop-zone");

items.forEach(item => {
    item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", e.target.id);
        e.target.classList.add("opacity-50");
    });
    item.addEventListener("dragend", (e) => {
        e.target.classList.remove("opacity-50");
    });
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault(); // nutné pro povolení drop
});
dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const el = document.getElementById(id);
    dropZone.appendChild(el);
});</code></pre>', 'lesson', 48, 25, 15),

(@kurs_id, 'SPA router (History API)', '<h2>Hash router</h2><pre><code>const routes = {};

function route(path, handler) { routes[path] = handler; }

function navigate(path) {
    window.location.hash = path;
}

function resolve() {
    const path = window.location.hash.slice(1) || "/";
    const handler = routes[path];
    if (handler) handler(); else routes["/"]();
}

window.addEventListener("hashchange", resolve);

// Použití
route("/", () => renderHome());
route("/kurzy", () => renderCourses());
route("/kurz/python", () => renderCourse("python"));
resolve();</code></pre>', 'lesson', 49, 25, 20),

(@kurs_id, 'VeVit XP widget', '<h2>XP progress bar</h2><pre><code>class XPWidget {
    constructor(el, xp, level) {
        this.el = el;
        this.xp = xp;
        this.level = level;
        this.render();
    }
    get progress() {
        const threshold = this.level * 100;
        return Math.min((this.xp % 1000) / 1000 * 100, 100);
    }
    addXP(amount) {
        this.xp += amount;
        const newLevel = Math.floor(this.xp / 1000) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            showToast(`Level up! Lvl ${this.level}`, "levelup");
        }
        this.render();
        localStorage.setItem("vevit-xp", this.xp);
    }
    render() {
        this.el.innerHTML = `
            &lt;div class="flex items-center gap-3"&gt;
                &lt;span class="text-sm font-bold text-accent"&gt;Lvl ${this.level}&lt;/span&gt;
                &lt;div class="flex-1 h-2 bg-[#1e1e1e] rounded-full overflow-hidden"&gt;
                    &lt;div class="h-full bg-accent rounded-full transition-all duration-500"
                         style="width: ${this.progress}%"&gt;&lt;/div&gt;
                &lt;/div&gt;
                &lt;span class="text-xs text-[#6b7280]"&gt;${this.xp} XP&lt;/span&gt;
            &lt;/div&gt;
        `;
    }
}</code></pre>', 'lesson', 50, 25, 20),

(@kurs_id, 'Nekonečný scroll', '<h2>Infinite scroll s Intersection Observer</h2><pre><code>let page = 1;
let loading = false;

async function loadMore() {
    if (loading) return;
    loading = true;
    const res = await fetch(`/api/courses?page=${page++}`);
    const data = await res.json();
    data.forEach(appendCard);
    loading = false;
}

// Sentinel element na konci seznamu
const sentinel = document.createElement("div");
sentinel.id = "scroll-sentinel";
list.after(sentinel);

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) loadMore();
}, { rootMargin: "200px" });
observer.observe(sentinel);</code></pre>', 'lesson', 51, 25, 15),

(@kurs_id, 'Kvíz engine', '<h2>Dynamický kvíz engine</h2><pre><code>class QuizEngine {
    #questions = [];
    #current = 0;
    #score = 0;
    #answers = [];

    constructor(questions) { this.#questions = questions; }

    get current() { return this.#questions[this.#current]; }
    get progress() { return (this.#current / this.#questions.length) * 100; }
    get isDone() { return this.#current >= this.#questions.length; }
    get result() { return { score: this.#score, total: this.#questions.length }; }

    answer(index) {
        const correct = this.current.correct;
        this.#answers.push({ q: this.#current, picked: index, correct: index === correct });
        if (index === correct) this.#score++;
        this.#current++;
    }
}

// Render loop
function renderQuestion(engine) {
    const q = engine.current;
    app.innerHTML = `
        &lt;div class="h-1.5 bg-[#1e1e1e] rounded-full mb-6"&gt;
            &lt;div class="h-full bg-accent rounded-full" style="width:${engine.progress}%"&gt;&lt;/div&gt;
        &lt;/div&gt;
        &lt;h2 class="text-xl font-bold text-white mb-6"&gt;${q.text}&lt;/h2&gt;
        &lt;div class="space-y-3"&gt;
            ${q.options.map((o, i) => `
                &lt;button data-i="${i}" class="quiz-option w-full text-left p-4 rounded-xl bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] hover:border-accent/30 text-white text-sm font-semibold"&gt;${o}&lt;/button&gt;
            `).join("")}
        &lt;/div&gt;
    `;
}</code></pre>', 'lesson', 52, 25, 25),

(@kurs_id, 'Kanban board', '<h2>Kanban s drag & drop</h2><pre><code>const columns = {
    todo: [], inProgress: [], done: []
};

function render() {
    Object.entries(columns).forEach(([key, items]) => {
        const col = document.querySelector(`[data-col="${key}"]`);
        col.innerHTML = items.map((item, i) => `
            &lt;div draggable="true" data-item="${key}-${i}"
                 class="p-3 rounded-lg bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] text-sm text-white cursor-grab"&gt;
                ${item}
            &lt;/div&gt;
        `).join("");
    });
}

// Drag mezi sloupci
document.querySelectorAll("[data-col]").forEach(col => {
    col.addEventListener("dragover", e => e.preventDefault());
    col.addEventListener("drop", (e) => {
        e.preventDefault();
        const [fromCol, fromIdx] = e.dataTransfer.getData("item").split("-");
        const [item] = columns[fromCol].splice(fromIdx, 1);
        columns[col.dataset.col].push(item);
        save(); render();
    });
});</code></pre>', 'lesson', 53, 25, 20),

(@kurs_id, 'Observer + Singleton patterns', '<h2>MutationObserver</h2><pre><code>const obs = new MutationObserver((mutations) => {
    mutations.forEach(m => {
        m.addedNodes.forEach(n => {
            if (n.nodeType === 1) lucide.createIcons({ nodes: [n] });
        });
    });
});
obs.observe(document.getElementById("app"), { childList: true, subtree: true });</code></pre><h2>Singleton logger</h2><pre><code>class Logger {
    static #instance;
    #logs = [];
    constructor() { if (Logger.#instance) return Logger.#instance; Logger.#instance = this; }
    log(msg) { this.#logs.push({ time: Date.now(), msg }); }
    get all() { return this.#logs; }
}
const logger = new Logger(); // vždy stejná instance</code></pre>', 'lesson', 54, 25, 15),

(@kurs_id, 'Bezpečnost (XSS + CSP)', '<h2>XSS prevence</h2><pre><code>// NEBEZPEČNÉ — XSS zranitelné!
el.innerHTML = userInput;

// BEZPEČNÉ — textContent escapuje HTML
el.textContent = userInput;

// Sanitizace (DOMPurify)
import DOMPurify from "dompurify";
el.innerHTML = DOMPurify.sanitize(userInput);</code></pre><h2>Content-Security-Policy</h2><pre><code>// HTTP hlavička
Content-Security-Policy: default-src ''self''; script-src ''self''; style-src ''self'' ''unsafe-inline'' cdn.tailwindcss.com; img-src * data:;

// &lt;meta&gt; tag
&lt;meta http-equiv="Content-Security-Policy"
      content="default-src ''self''; script-src ''self''"&gt;</code></pre><p>CSP blokuje inline skripty a externí zdroje — účinná obrana proti XSS.</p>', 'lesson', 55, 25, 15),

(@kurs_id, 'Performance (virtual scroll)', '<h2>Virtual scrolling</h2><p>Pro seznamy s tisíci položkami — renderuje se jen viditelná část.</p><pre><code>class VirtualList {
    #items = [];
    #itemHeight = 48;
    #container = null;

    constructor(container, items) {
        this.#items = items;
        this.#container = container;
        this.#container.style.overflow = "auto";
        this.#container.addEventListener("scroll", () => this.#render());
        this.#render();
    }

    #render() {
        const scrollTop = this.#container.scrollTop;
        const viewH = this.#container.clientHeight;
        const start = Math.floor(scrollTop / this.#itemHeight);
        const end = Math.min(start + Math.ceil(viewH / this.#itemHeight) + 2, this.#items.length);
        const visible = this.#items.slice(start, end);

        this.#container.innerHTML = `
            &lt;div style="height:${this.#items.length * this.#itemHeight}px; position:relative"&gt;
                ${visible.map((item, i) => `
                    &lt;div style="position:absolute; top:${(start+i)*this.#itemHeight}px; height:${this.#itemHeight}px; width:100%"&gt;
                        ${item}
                    &lt;/div&gt;
                `).join("")}
            &lt;/div&gt;
        `;
    }
}</code></pre>', 'lesson', 56, 25, 20),

(@kurs_id, 'Intl API prakticky', '<h2>Formátování v praxi</h2><pre><code>// Čísla
const price = new Intl.NumberFormat("cs-CZ", {
    style: "currency", currency: "CZK"
}).format(2990); // "2 990,00 Kč"

// Data
const date = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric", month: "long", year: "numeric"
}).format(new Date()); // "13. dubna 2026"

// Relativní čas
const rtf = new Intl.RelativeTimeFormat("cs-CZ", { numeric: "auto" });
rtf.format(-1, "day");  // "včera"
rtf.format(-3, "day");  // "před 3 dny"
rtf.format(1, "day");   // "zítra"

// Plurály
const pl = new Intl.PluralRules("cs-CZ");
pl.select(1);  // "one"
pl.select(2);  // "few"
pl.select(5);  // "other"</code></pre>', 'lesson', 57, 25, 12),

(@kurs_id, 'Web Components', '<h2>Custom elements</h2><pre><code>class XpBadge extends HTMLElement {
    connectedCallback() {
        const xp = this.getAttribute("xp") || "0";
        this.innerHTML = `
            &lt;span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold"&gt;
                ⚡ ${xp} XP
            &lt;/span&gt;
        `;
    }
}
customElements.define("xp-badge", XpBadge);

// Použití v HTML
// &lt;xp-badge xp="150"&gt;&lt;/xp-badge&gt;</code></pre><h2>Shadow DOM</h2><pre><code>class VeVitCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = `
            &lt;style&gt;:host { display: block; padding: 16px; border-radius: 12px; background: #161616; }&lt;/style&gt;
            &lt;slot&gt;&lt;/slot&gt;
        `;
    }
}
customElements.define("vevit-card", VeVitCard);</code></pre>', 'lesson', 58, 25, 18),

(@kurs_id, 'Form builder', '<h2>Dynamický formulář</h2><pre><code>const fields = [
    { name: "title", type: "text", label: "Název", required: true },
    { name: "difficulty", type: "select", label: "Obtížnost", options: ["Začátečník", "Pokročilý"] },
    { name: "xp", type: "number", label: "XP odměna", min: 0 },
    { name: "active", type: "checkbox", label: "Aktivní" },
];

function buildForm(fields) {
    return fields.map(f => {
        const input = f.type === "select"
            ? `&lt;select name="${f.name}" class="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-lg p-2 text-white"&gt;${f.options.map(o => `&lt;option&gt;${o}&lt;/option&gt;`).join("")}&lt;/select&gt;`
            : `&lt;input type="${f.type}" name="${f.name}" ${f.min ? `min="${f.min}"` : ""} class="bg-[#161616] border border-[rgba(255,255,255,0.06)] rounded-lg p-2 text-white"&gt;`;
        return `&lt;label class="block text-sm text-[#6b7280] mb-1"&gt;${f.label}&lt;/label&gt;${input}`;
    }).join("");
}

function serialize(form) {
    return Object.fromEntries(new FormData(form));
}</code></pre>', 'lesson', 59, 25, 15),

(@kurs_id, 'Roadmapa a další kroky', '<h2>Shrnutí kurzu</h2><p>Gratulujeme! Projel jsi základy, pokročilé koncepty, browser APIs i reálné projekty v JavaScriptu.</p><h2>Další kroky</h2><ul><li><strong>TypeScript</strong> — typová bezpečnost pro větší projekty</li><li><strong>React / Vue / Svelte</strong> — frameworky pro komplexní UI</li><li><strong>Node.js + Express</strong> — full-stack vývoj</li><li><strong>Testování</strong> — Jest, Vitest, Playwright</li><li><strong>DevOps</strong> — Docker, CI/CD, deployment</li></ul><h2>Zdroje</h2><ul><li><a href="https://developer.mozilla.org/cs/">MDN Web Docs</a> — referenční příručka</li><li><a href="https://javascript.info/">javascript.info</a> — moderní tutoriál</li><li>Další kurzy na <strong>edu.vevit.fun</strong> — TypeScript, Node.js, Docker</li></ul>', 'lesson', 60, 25, 10);


-- ============================================================
-- KVÍZ 4: Projekty (sort_order 61)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Kvíz 4 — Projekty a best practices', '<p>Ověř znalosti z projektové sekce.</p>', 'quiz', 61, 50, 10);

SET @q4 = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@q4, 'Jak uložíš pole objektů do localStorage?', 'localStorage.set(arr)', 'localStorage.setItem("key", JSON.stringify(arr))', 'localStorage.save(arr)', 'Nejde — localStorage ukládá jen stringy', 'b', 'localStorage ukládá jen stringy — proto objekty a pole serializujeme přes JSON.stringify() a čteme přes JSON.parse().', 1),
(@q4, 'Co je XSS?', 'Chyba v CSS', 'Útok vložením škodlivého skriptu přes innerHTML', 'Chyba v TypeScriptu', 'Pomalé načítání', 'b', 'XSS = Cross-Site Scripting — útočník vloží JS kód přes neošetřený vstup. Prevence: textContent místo innerHTML, CSP hlavička.', 2),
(@q4, 'Co dělá Virtual Scroll?', 'Zrychluje síťové požadavky', 'Renderuje jen viditelné položky velkého seznamu', 'Komprimuje data', 'Zvětšuje písmo', 'b', 'Virtual scroll renderuje jen elementy v viewportu — umožňuje plynulé scrollování i s 100 000 položkami.', 3),
(@q4, 'Jaký je rozdíl mezi MutationObserver a IntersectionObserver?', 'Jsou stejné', 'MutationObserver sleduje DOM změny, IntersectionObserver viditelnost', 'MutationObserver je rychlejší', 'IntersectionObserver sleduje clicks', 'b', 'MutationObserver reaguje na přidání/odebrání DOM uzlů, IntersectionObserver na vstup/výstup z viewportu.', 4),
(@q4, 'Co je Shadow DOM v Web Components?', 'Skrytý element', 'Izolovaný DOM strom s vlastními styly', 'Typ animace', 'Dark mode DOM', 'b', 'Shadow DOM vytváří izolovaný scope — styly uvnitř neovlivní zbytek stránky a naopak.', 5);


-- ============================================================
-- ZÁVĚREČNÝ KVÍZ (sort_order 62)
-- ============================================================

INSERT INTO lessons (course_id, title, content, lesson_type, sort_order, xp_reward, duration_minutes) VALUES
(@kurs_id, 'Závěrečný kvíz — Celý JavaScript kurz', '<p>Závěrečný test pokrývající všechny sekce kurzu JavaScript.</p>', 'final_quiz', 62, 200, 30);

SET @qfin = LAST_INSERT_ID();

INSERT INTO quizzes (lesson_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation, sort_order) VALUES
(@qfin, 'Co vypíše typeof []?', '"array"', '"object"', '"list"', '"undefined"', 'b', 'Pole v JS je objekt — typeof [] vrací "object". Pro ověření pole použij Array.isArray().', 1),
(@qfin, 'Co je closure v JavaScriptu?', 'Funkce bez parametrů', 'Funkce, která si pamatuje svůj lexikální scope', 'Třída', 'Metoda objektu', 'b', 'Closure = funkce, která uchovává přístup k proměnným ze scope, ve kterém byla definována, i po jeho opuštění.', 2),
(@qfin, 'Jaký je výsledek null ?? 42?', 'null', '42', 'undefined', '0', 'b', '?? (nullish coalescing) vrací pravou stranu jen pokud levá je null nebo undefined. null ?? 42 = 42.', 3),
(@qfin, 'Co dělá Object.create(animal)?', 'Zkopíruje animal', 'Vytvoří objekt s prototypem animal', 'Smaže animal', 'Vytvoří třídu', 'b', 'Object.create() vytvoří nový objekt, jehož __proto__ odkazuje na zadaný prototyp.', 4),
(@qfin, 'Jaký je rozdíl mezi .then a async/await?', 'Žádný', 'async/await je syntaktický cukr pro Promises', '.then je asynchronní, await ne', 'await funguje jen v Node.js', 'b', 'async/await je syntaktický cukr nad Promises — pod kapotou je to stále .then().', 5),
(@qfin, 'Co je Service Worker?', 'Serverový proces', 'Skript běžící na pozadí prohlížeče', 'Typ databáze', 'CSS framework', 'b', 'Service Worker je skript na pozadí, který zpracovává fetch/push/sync — umožňuje offline chod a PWA.', 6),
(@qfin, 'Jak předejdeš XSS při zobrazení uživatelského vstupu?', 'innerHTML', 'textContent nebo DOMPurify.sanitize()', 'JSON.stringify', 'encodeURIComponent', 'b', 'textContent automaticky escapuje HTML značky. Pokud potřebuješ HTML, použij DOMPurify.', 7),
(@qfin, 'Co dělá Symbol("id")?', 'Vytvoří string "id"', 'Vytvoří unikátní hodnotu', 'Vytvoří číslo', 'Vytvoří globální proměnnou', 'b', 'Symbol() vždy vytvoří unikátní hodnotu — i se stejným popisem nejsou dva Symboly stejné.', 8),
(@qfin, 'Jaký je výsledek [...new Set([1,1,2,2,3])]?', '[1,1,2,2,3]', '[1,2,3]', 'Set{1,2,3}', 'Chyba', 'b', 'Set odstraní duplikáty, spread (...) převede na pole: [1,2,3].', 9),
(@qfin, 'Co je Proxy v JS?', 'Server proxy', 'Objekt, který zachycuje operace nad jiným objektem', 'Typ sítě', 'Middleware', 'b', 'Proxy obaluje target objekt a pomocí handlerů (traps) zachycuje get/set/delete a další operace.', 10),
(@qfin, 'Co dělá requestAnimationFrame?', 'Čeká na DOM update', 'Naplánuje funkci před dalším překreslením', 'Spustí funkci okamžitě', 'Zastaví animaci', 'b', 'requestAnimationFrame() naplánuje callback před dalším repaintem — ideální pro plynulé animace (60fps).', 11),
(@qfin, 'Jaký je rozdíl mezi Map a Object?', 'Žádný', 'Map má klíče jakéhokoliv typu a udržuje pořadí', 'Object je rychlejší', 'Map nepodporuje delete', 'b', 'Map na rozdíl od Object: klíče mohou být jakéhokoliv typu, udržuje pořadí vložení, má .size.', 12),
(@qfin, 'Co je debounce?', 'Zrychlení funkce', 'Funkce se zavolá až po ukončení série událostí', 'Rychlé volání funkce', 'Typ Promise', 'b', 'Debounce čeká na konec série rychlých událostí (např. psaní) a pak zavolá funkci jednou.', 13),
(@qfin, 'Co je Shadow DOM?', 'Skrytý element', 'Izolovaný DOM strom s vlastním scope CSS', 'Dark mode', 'Virtual DOM', 'b', 'Shadow DOM vytváří zapouzdřený DOM strom — styly uvnitř neuniknou ven a vnější styly neovlivní uvnitř.', 14),
(@qfin, 'Jaký je výstup: "5" - 3?', '"53"', '2', 'NaN', 'chyba', 'b', 'Operátor - provádí numeric coercion — "5" se převede na 5, výsledek je 2. (Na rozdíl od +, který dělá string concatenation.)', 15);


-- ============================================================
-- Aktualizace počtu lekcí
-- ============================================================

UPDATE courses SET lesson_count = (SELECT COUNT(*) FROM lessons WHERE course_id = @kurs_id) WHERE id = @kurs_id;