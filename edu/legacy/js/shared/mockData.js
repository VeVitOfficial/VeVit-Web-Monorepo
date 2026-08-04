// Mock data for all 18 courses — used when API is unavailable (file://, dev)
// Lesson IDs are unique across all courses: Python 1-38, JS 101-132, HTML 201-220, etc.

export const COURSE_ICON_URLS = {
    python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    'html-css': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
    sql: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    php: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    java: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    csharp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    cpp: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    rust: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
    golang: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    kotlin: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
    swift: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
    ruby: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
    git: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
    docker: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    terminal: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    'zaklady-programovani': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/devicon/devicon-original.svg',
};

export function getCourseIconUrl(slug) {
    return COURSE_ICON_URLS[slug] || COURSE_ICON_URLS['zaklady-programovani'];
}

export function courseIconImg(slug, size = 40) {
    const url = getCourseIconUrl(slug);
    return `<img src="${url}" alt="${slug}" class="w-[${size}px] h-[${size}px] object-contain" loading="lazy" data-hide-on-error>`;
}

export const MOCK_COURSES = [
    {
        slug: 'python', title: 'Python',
        description: 'Nejpopulárnější jazyk pro začátečníky. Naučíš se základy i pokročilé konstrukce a napíšeš vlastní projekty.',
        difficulty: 'beginner', xp_reward: 2000,
        thumbnail_color: '#3b82f6', thumbnail_icon: 'code-2', lesson_count: 47,
        sections: [
            { title: 'Sekce 1 — Základy', lessons: [
                { id: 1,  title: 'Instalace a první program',      type: 'lesson', duration: 10, xp: 10 },
                { id: 2,  title: 'Proměnné a datové typy',         type: 'lesson', duration: 12, xp: 10 },
                { id: 3,  title: 'Operátory a výrazy',             type: 'lesson', duration: 12, xp: 10 },
                { id: 4,  title: 'Řetězce a f-stringy',            type: 'lesson', duration: 12, xp: 10 },
                { id: 5,  title: 'Podmínky if/elif/else',          type: 'lesson', duration: 12, xp: 10 },
                { id: 6,  title: 'Cyklus while',                   type: 'lesson', duration: 12, xp: 10 },
                { id: 7,  title: 'Cyklus for a range()',           type: 'lesson', duration: 12, xp: 10 },
                { id: 8,  title: 'Funkce a parametry',             type: 'lesson', duration: 15, xp: 10 },
                { id: 9,  title: 'Rekurze',                        type: 'lesson', duration: 15, xp: 10 },
                { id: 10, title: 'Moduly a import',                type: 'lesson', duration: 12, xp: 10 },
                { id: 11, title: 'Výjimky — try/except',          type: 'lesson', duration: 12, xp: 10 },
                { id: 12, title: 'Kvíz 1 — Základy Pythonu',      type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 2 — Datové struktury', lessons: [
                { id: 13, title: 'Listy a list comprehensions',    type: 'lesson', duration: 15, xp: 15 },
                { id: 14, title: 'Tuple a Set',                    type: 'lesson', duration: 12, xp: 15 },
                { id: 15, title: 'Dictionary a dict comprehensions',type: 'lesson', duration: 15, xp: 15 },
                { id: 16, title: 'OOP — třídy a objekty',          type: 'lesson', duration: 18, xp: 15 },
                { id: 17, title: 'OOP — dědičnost',                type: 'lesson', duration: 18, xp: 15 },
                { id: 18, title: 'Dekorátory',                     type: 'lesson', duration: 18, xp: 15 },
                { id: 19, title: 'Generátory',                     type: 'lesson', duration: 15, xp: 15 },
                { id: 20, title: 'Kvíz 2 — Datové struktury',     type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 3 — Pokročilý Python', lessons: [
                { id: 21, title: 'Soubory a pathlib',              type: 'lesson', duration: 15, xp: 15 },
                { id: 22, title: 'Regulární výrazy',               type: 'lesson', duration: 18, xp: 15 },
                { id: 23, title: 'asyncio',                        type: 'lesson', duration: 20, xp: 15 },
                { id: 24, title: 'SQLite3',                        type: 'lesson', duration: 18, xp: 15 },
                { id: 25, title: 'Type hints a dataclasses',       type: 'lesson', duration: 15, xp: 15 },
                { id: 26, title: 'Kvíz 3 — Pokročilý Python',     type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 4 — Praktický Python', lessons: [
                { id: 27, title: 'requests a HTTP',                type: 'lesson', duration: 15, xp: 15 },
                { id: 28, title: 'Web scraping — BeautifulSoup',  type: 'lesson', duration: 20, xp: 15 },
                { id: 29, title: 'Flask — základy',                type: 'lesson', duration: 20, xp: 15 },
                { id: 291, title: 'Flask Blueprint',               type: 'lesson', duration: 18, xp: 15 },
                { id: 292, title: 'REST API s Flaskem',             type: 'lesson', duration: 20, xp: 15 },
                { id: 30, title: 'Pandas intro',                   type: 'lesson', duration: 20, xp: 15 },
                { id: 301, title: 'NumPy',                         type: 'lesson', duration: 18, xp: 15 },
                { id: 302, title: 'Matplotlib',                     type: 'lesson', duration: 18, xp: 15 },
                { id: 31, title: 'threading a subprocess',         type: 'lesson', duration: 18, xp: 15 },
                { id: 303, title: 'logging',                        type: 'lesson', duration: 15, xp: 15 },
                { id: 304, title: 'argparse — CLI argumenty',      type: 'lesson', duration: 15, xp: 15 },
                { id: 305, title: '.env a konfigurace',             type: 'lesson', duration: 15, xp: 15 },
                { id: 32, title: 'Kvíz 4 — Praktický Python',     type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 5 — Projekty', lessons: [
                { id: 33, title: 'Projekt: CLI Todo aplikace',     type: 'lesson', duration: 30, xp: 20 },
                { id: 34, title: 'Projekt: CSV Analyzér',          type: 'lesson', duration: 30, xp: 20 },
                { id: 35, title: 'Projekt: Flask REST API',        type: 'lesson', duration: 30, xp: 20 },
                { id: 351, title: 'Projekt: File Organizer',       type: 'lesson', duration: 35, xp: 20 },
                { id: 36, title: 'Projekt: Web Scraper',           type: 'lesson', duration: 25, xp: 20 },
                { id: 361, title: 'Projekt: Datová vizualizace',   type: 'lesson', duration: 40, xp: 20 },
                { id: 37, title: 'Python roadmapa',                type: 'lesson', duration: 10, xp: 10 },
                { id: 38, title: 'Závěrečný kvíz — Python',       type: 'final_quiz', duration: 30, xp: 200 },
            ]}
        ]
    },
    {
        slug: 'javascript', title: 'JavaScript',
        description: 'Moderní JavaScript od základů po pokročilé vzory, DOM, async a projekty.',
        difficulty: 'beginner', xp_reward: 2000,
        thumbnail_color: '#f59e0b', thumbnail_icon: 'braces', lesson_count: 51,
        sections: [
            { title: 'Sekce 1 — Základy JS', lessons: [
                { id: 101, title: 'var, let, const a typy',           type: 'lesson', duration: 12, xp: 10 },
                { id: 102, title: 'Operátory a type coercion',        type: 'lesson', duration: 12, xp: 10 },
                { id: 103, title: 'Řetězce a template literals',      type: 'lesson', duration: 12, xp: 10 },
                { id: 104, title: 'Pole — metody',                    type: 'lesson', duration: 15, xp: 10 },
                { id: 105, title: 'Objekty a destrukturování',        type: 'lesson', duration: 15, xp: 10 },
                { id: 106, title: 'Funkce a arrow functions',         type: 'lesson', duration: 15, xp: 10 },
                { id: 107, title: 'DOM — querySelector a manipulace', type: 'lesson', duration: 18, xp: 10 },
                { id: 108, title: 'Events a addEventListener',        type: 'lesson', duration: 15, xp: 10 },
                { id: 109, title: 'Fetch API a async/await',          type: 'lesson', duration: 18, xp: 10 },
                { id: 110, title: 'Promises',                         type: 'lesson', duration: 15, xp: 10 },
                { id: 111, title: 'localStorage a sessionStorage',    type: 'lesson', duration: 12, xp: 10 },
                { id: 112, title: 'Kvíz 1 — Základy JS',             type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 2 — Pokročilý JS', lessons: [
                { id: 113, title: 'Closures a scope',                 type: 'lesson', duration: 20, xp: 15 },
                { id: 114, title: 'Prototypy a prototypový řetězec',  type: 'lesson', duration: 18, xp: 15 },
                { id: 115, title: 'Generátory a iterátory',           type: 'lesson', duration: 20, xp: 15 },
                { id: 116, title: 'Map, Set, WeakMap',                type: 'lesson', duration: 18, xp: 15 },
                { id: 117, title: 'Proxy a Reflect',                  type: 'lesson', duration: 20, xp: 15 },
                { id: 118, title: 'Regex v JavaScriptu',              type: 'lesson', duration: 18, xp: 15 },
                { id: 119, title: 'Funkcionální programování',        type: 'lesson', duration: 20, xp: 15 },
                { id: 120, title: 'Kvíz 2 — Pokročilý JS',           type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 3 — Browser APIs', lessons: [
                { id: 121, title: 'Intersection Observer',            type: 'lesson', duration: 18, xp: 15 },
                { id: 122, title: 'Service Workers a PWA',            type: 'lesson', duration: 22, xp: 15 },
                { id: 1221, title: 'Canvas API — pokročile',          type: 'lesson', duration: 20, xp: 15 },
                { id: 123, title: 'Canvas API',                       type: 'lesson', duration: 25, xp: 15 },
                { id: 124, title: 'Web Workers',                      type: 'lesson', duration: 18, xp: 15 },
                { id: 1241, title: 'Clipboard API',                   type: 'lesson', duration: 15, xp: 15 },
                { id: 1242, title: 'Drag and Drop API',               type: 'lesson', duration: 18, xp: 15 },
                { id: 1243, title: 'WebSockets',                      type: 'lesson', duration: 18, xp: 15 },
                { id: 1244, title: 'IndexedDB',                       type: 'lesson', duration: 20, xp: 15 },
                { id: 1245, title: 'Web Storage pokročile',           type: 'lesson', duration: 18, xp: 15 },
                { id: 125, title: 'Kvíz 3 — Browser APIs',           type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 4 — Projekty', lessons: [
                { id: 126, title: 'Projekt: Todo aplikace',           type: 'lesson', duration: 30, xp: 20 },
                { id: 127, title: 'Projekt: GitHub viewer',           type: 'lesson', duration: 30, xp: 20 },
                { id: 1271, title: 'Projekt: Kalkulačka',              type: 'lesson', duration: 35, xp: 20 },
                { id: 1272, title: 'Projekt: Real-time chat',          type: 'lesson', duration: 45, xp: 20 },
                { id: 128, title: 'Projekt: SPA router',              type: 'lesson', duration: 30, xp: 20 },
                { id: 1281, title: 'Projekt: XP progress widget',     type: 'lesson', duration: 35, xp: 20 },
                { id: 1282, title: 'Projekt: Nekonečný scroll',       type: 'lesson', duration: 40, xp: 20 },
                { id: 129, title: 'Projekt: Kvíz engine',             type: 'lesson', duration: 30, xp: 20 },
                { id: 1291, title: 'Projekt: Form builder',           type: 'lesson', duration: 40, xp: 20 },
                { id: 1292, title: 'Projekt: Markdown preview',       type: 'lesson', duration: 40, xp: 20 },
                { id: 1293, title: 'Projekt: Stopky a timer',         type: 'lesson', duration: 35, xp: 20 },
                { id: 130, title: 'Projekt: Kanban board',            type: 'lesson', duration: 30, xp: 20 },
                { id: 1301, title: 'Design patterns v JS',            type: 'lesson', duration: 18, xp: 20 },
                { id: 1302, title: 'Bezpečnost v JS',                 type: 'lesson', duration: 18, xp: 20 },
                { id: 1303, title: 'Performance optimalizace',        type: 'lesson', duration: 18, xp: 20 },
                { id: 1304, title: 'Web Components',                   type: 'lesson', duration: 18, xp: 20 },
                { id: 1305, title: 'Intl API',                         type: 'lesson', duration: 15, xp: 20 },
                { id: 131, title: 'JavaScript roadmapa',              type: 'lesson', duration: 15, xp: 20 },
                { id: 1311, title: 'Kvíz 4 — Projekty a pokročilé vzory', type: 'quiz', duration: 15, xp: 50 },
                { id: 132, title: 'Závěrečný kvíz — JavaScript',     type: 'final_quiz', duration: 30, xp: 200 },
            ]}
        ]
    },
    {
        slug: 'html-css', title: 'HTML & CSS',
        description: 'Tvorba webových stránek od HTML struktury po pokročilé CSS techniky a Tailwind.',
        difficulty: 'beginner', xp_reward: 800,
        thumbnail_color: '#ec4899', thumbnail_icon: 'layout', lesson_count: 20,
        sections: [
            { title: 'Sekce 1 — HTML', lessons: [
                { id: 201, title: 'Co je HTML a struktura dokumentu', type: 'lesson', duration: 10, xp: 10 },
                { id: 202, title: 'Základní HTML tagy',              type: 'lesson', duration: 12, xp: 10 },
                { id: 203, title: 'Sémantické elementy HTML5',       type: 'lesson', duration: 12, xp: 10 },
                { id: 204, title: 'Formuláře a inputy',              type: 'lesson', duration: 15, xp: 10 },
                { id: 205, title: 'Kvíz 1 — HTML základy',          type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 2 — CSS', lessons: [
                { id: 206, title: 'CSS selektory a specifičnost',    type: 'lesson', duration: 15, xp: 10 },
                { id: 207, title: 'Box model',                       type: 'lesson', duration: 15, xp: 10 },
                { id: 208, title: 'Flexbox',                         type: 'lesson', duration: 18, xp: 10 },
                { id: 209, title: 'CSS Grid',                        type: 'lesson', duration: 18, xp: 10 },
                { id: 210, title: 'Media queries — responsive',      type: 'lesson', duration: 15, xp: 10 },
                { id: 211, title: 'Tailwind CSS via CDN',            type: 'lesson', duration: 15, xp: 10 },
                { id: 212, title: 'CSS proměnné a animace',          type: 'lesson', duration: 15, xp: 10 },
                { id: 213, title: 'Moderní dark UI design — neumorphism', type: 'lesson', duration: 18, xp: 10 },
                { id: 214, title: 'Kvíz 2 — CSS',                   type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 3 — Pokročilé', lessons: [
                { id: 215, title: 'Container queries',               type: 'lesson', duration: 15, xp: 15 },
                { id: 216, title: 'CSS filtry a backdrop-filter',    type: 'lesson', duration: 15, xp: 15 },
                { id: 217, title: 'Přístupnost (ARIA)',              type: 'lesson', duration: 15, xp: 15 },
                { id: 218, title: 'Core Web Vitals a optimalizace',  type: 'lesson', duration: 15, xp: 15 },
                { id: 219, title: 'Projekt: Responzivní landing page', type: 'lesson', duration: 40, xp: 20 },
                { id: 220, title: 'Závěrečný kvíz — HTML & CSS',    type: 'final_quiz', duration: 25, xp: 200 },
            ]}
        ]
    },
    {
        slug: 'sql', title: 'SQL & Databáze',
        description: 'Relační databáze, SQL dotazy, JOINy, indexy a optimalizace na MariaDB.',
        difficulty: 'beginner', xp_reward: 900,
        thumbnail_color: '#06b6d4', thumbnail_icon: 'database', lesson_count: 19,
        sections: [
            { title: 'Sekce 1 — Základy SQL', lessons: [
                { id: 301, title: 'Co je relační databáze',          type: 'lesson', duration: 12, xp: 10 },
                { id: 302, title: 'SELECT a WHERE',                  type: 'lesson', duration: 15, xp: 10 },
                { id: 303, title: 'ORDER BY, LIMIT, OFFSET',         type: 'lesson', duration: 12, xp: 10 },
                { id: 304, title: 'Agregace — COUNT, SUM, AVG',      type: 'lesson', duration: 18, xp: 10 },
                { id: 305, title: 'JOINy — INNER, LEFT, RIGHT',      type: 'lesson', duration: 20, xp: 10 },
                { id: 306, title: 'INSERT, UPDATE, DELETE',          type: 'lesson', duration: 18, xp: 10 },
                { id: 307, title: 'CREATE TABLE a datové typy',      type: 'lesson', duration: 18, xp: 10 },
                { id: 308, title: 'Indexy a výkon',                  type: 'lesson', duration: 18, xp: 10 },
                { id: 309, title: 'Transakce a ACID',                type: 'lesson', duration: 15, xp: 10 },
                { id: 310, title: 'Kvíz 1 — Základy SQL',           type: 'quiz',   duration: 15, xp: 50 },
            ]},
            { title: 'Sekce 2 — Pokročilé SQL', lessons: [
                { id: 311, title: 'Subqueries a CTE (WITH)',         type: 'lesson', duration: 20, xp: 15 },
                { id: 312, title: 'Window functions',                type: 'lesson', duration: 22, xp: 15 },
                { id: 313, title: 'EXPLAIN a optimalizace',          type: 'lesson', duration: 18, xp: 15 },
                { id: 314, title: 'Normalizace 1NF/2NF/3NF',         type: 'lesson', duration: 15, xp: 15 },
                { id: 315, title: 'Fulltext search',                 type: 'lesson', duration: 15, xp: 15 },
                { id: 316, title: 'Komplexní dotazy — reálné příklady', type: 'lesson', duration: 20, xp: 15 },
                { id: 317, title: 'Bezpečnost — SQL Injection',      type: 'lesson', duration: 15, xp: 15 },
                { id: 318, title: 'Kvíz 2 — Pokročilé SQL',         type: 'quiz',   duration: 15, xp: 50 },
                { id: 319, title: 'Závěrečný kvíz — SQL',           type: 'final_quiz', duration: 25, xp: 200 },
            ]}
        ]
    },
    {
        slug: 'zaklady-programovani', title: 'Základy programování',
        description: 'Algoritmy, datové struktury, OOP a základní koncepty programování bez závislosti na jazyce.',
        difficulty: 'beginner', xp_reward: 600,
        thumbnail_color: '#8b5cf6', thumbnail_icon: 'cpu', lesson_count: 19,
        sections: [
            { title: 'Základy', lessons: [
                { id: 401, title: 'Co je programování a algoritmus',  type: 'lesson', duration: 10, xp: 10 },
                { id: 402, title: 'Binární soustava',                type: 'lesson', duration: 12, xp: 10 },
                { id: 403, title: 'Proměnné a datové typy',          type: 'lesson', duration: 12, xp: 10 },
                { id: 404, title: 'Podmínky a větvení',              type: 'lesson', duration: 12, xp: 10 },
                { id: 405, title: 'Cykly a opakování',               type: 'lesson', duration: 12, xp: 10 },
                { id: 406, title: 'Funkce a DRY princip',            type: 'lesson', duration: 12, xp: 10 },
                { id: 407, title: 'Pole a kolekce',                  type: 'lesson', duration: 12, xp: 10 },
                { id: 408, title: 'Slovníky (klíč-hodnota)',         type: 'lesson', duration: 12, xp: 10 },
                { id: 409, title: 'Rekurze',                         type: 'lesson', duration: 12, xp: 10 },
                { id: 410, title: 'Debugging',                       type: 'lesson', duration: 12, xp: 10 },
                { id: 411, title: 'Datové struktury — přehled',      type: 'lesson', duration: 12, xp: 10 },
                { id: 412, title: 'Big O notace',                    type: 'lesson', duration: 12, xp: 10 },
                { id: 413, title: 'OOP — základy',                   type: 'lesson', duration: 12, xp: 10 },
                { id: 414, title: 'Git — úvod',                      type: 'lesson', duration: 12, xp: 10 },
                { id: 415, title: 'Internet a web',                  type: 'lesson', duration: 12, xp: 10 },
                { id: 416, title: 'Databáze — úvod',                 type: 'lesson', duration: 12, xp: 10 },
                { id: 417, title: 'Bezpečnost v programování',       type: 'lesson', duration: 12, xp: 10 },
                { id: 418, title: 'Výběr jazyka — roadmapa',         type: 'lesson', duration: 10, xp: 10 },
                { id: 419, title: 'Závěrečný kvíz',                  type: 'final_quiz', duration: 20, xp: 100 },
            ]}
        ]
    },
    {
        slug: 'terminal', title: 'Terminál & Bash',
        description: 'Ovládání terminálu, Bash skripty, SSH, Git workflow a automatizace na Linuxu.',
        difficulty: 'beginner', xp_reward: 600,
        thumbnail_color: '#6b7280', thumbnail_icon: 'terminal', lesson_count: 18,
        sections: [
            { title: 'Terminál', lessons: [
                { id: 501, title: 'Co je terminál a shell',          type: 'lesson', duration: 10, xp: 10 },
                { id: 502, title: 'Navigace — pwd, ls, cd',          type: 'lesson', duration: 12, xp: 10 },
                { id: 503, title: 'Soubory — mkdir, cp, mv, rm',     type: 'lesson', duration: 15, xp: 10 },
                { id: 504, title: 'Pipes a přesměrování',            type: 'lesson', duration: 15, xp: 10 },
                { id: 505, title: 'Proměnné a .bashrc',              type: 'lesson', duration: 15, xp: 10 },
                { id: 506, title: 'Procesy — ps, kill, top',         type: 'lesson', duration: 12, xp: 10 },
                { id: 507, title: 'SSH — vzdálený server',           type: 'lesson', duration: 15, xp: 10 },
                { id: 508, title: 'Bash skripty',                    type: 'lesson', duration: 20, xp: 10 },
                { id: 509, title: 'find a grep',                     type: 'lesson', duration: 15, xp: 10 },
                { id: 510, title: 'Git workflow v terminálu',        type: 'lesson', duration: 15, xp: 10 },
                { id: 511, title: 'Vim — přežití',                   type: 'lesson', duration: 12, xp: 10 },
                { id: 512, title: 'Cron — plánování',                type: 'lesson', duration: 12, xp: 10 },
                { id: 513, title: 'chmod, chown, oprávnění',         type: 'lesson', duration: 12, xp: 10 },
                { id: 514, title: 'sed, awk, sort, uniq',            type: 'lesson', duration: 15, xp: 10 },
                { id: 515, title: 'Tmux',                            type: 'lesson', duration: 12, xp: 10 },
                { id: 516, title: 'Docker CLI základy',              type: 'lesson', duration: 15, xp: 10 },
                { id: 517, title: 'Wedos Apache — logy a restart',   type: 'lesson', duration: 12, xp: 10 },
                { id: 518, title: 'Závěrečný kvíz',                  type: 'final_quiz', duration: 20, xp: 100 },
            ]}
        ]
    },
    {
        slug: 'typescript', title: 'TypeScript',
        description: 'Statické typování pro JavaScript — typy, generika, utility types a produkční vzory.',
        difficulty: 'intermediate', xp_reward: 900,
        thumbnail_color: '#3b82f6', thumbnail_icon: 'type', lesson_count: 14,
        sections: [
            { title: 'TypeScript', lessons: [
                { id: 601, title: 'Úvod do TypeScriptu',             type: 'lesson', duration: 12, xp: 10 },
                { id: 602, title: 'Základní typy',                   type: 'lesson', duration: 15, xp: 10 },
                { id: 603, title: 'Interfaces a Type aliases',       type: 'lesson', duration: 15, xp: 15 },
                { id: 604, title: 'Generika',                        type: 'lesson', duration: 18, xp: 15 },
                { id: 605, title: 'TypeScript s DOM',                type: 'lesson', duration: 15, xp: 15 },
                { id: 606, title: 'Utility Types',                   type: 'lesson', duration: 18, xp: 15 },
                { id: 607, title: 'Mapped a Conditional Types',      type: 'lesson', duration: 20, xp: 15 },
                { id: 608, title: 'Template Literal Types',          type: 'lesson', duration: 15, xp: 15 },
                { id: 609, title: 'Třídy pokročile',                 type: 'lesson', duration: 18, xp: 15 },
                { id: 610, title: 'Async TypeScript',                type: 'lesson', duration: 18, xp: 15 },
                { id: 611, title: 'Zod — runtime validace',          type: 'lesson', duration: 20, xp: 15 },
                { id: 612, title: 'tsconfig.json',                   type: 'lesson', duration: 12, xp: 10 },
                { id: 613, title: 'Migrace z JS na TS',              type: 'lesson', duration: 15, xp: 15 },
                { id: 614, title: 'Závěrečný kvíz — TypeScript',    type: 'final_quiz', duration: 25, xp: 200 },
            ]}
        ]
    },
    {
        slug: 'php', title: 'PHP',
        description: 'PHP 8.x pro backend — PDO, OOP, REST API, bezpečnost a moderní architektura.',
        difficulty: 'intermediate', xp_reward: 900,
        thumbnail_color: '#7c3aed', thumbnail_icon: 'server', lesson_count: 16,
        sections: [
            { title: 'PHP', lessons: [
                { id: 701, title: 'Úvod do PHP',                     type: 'lesson', duration: 12, xp: 10 },
                { id: 702, title: 'Proměnné, typy, podmínky, cykly', type: 'lesson', duration: 15, xp: 10 },
                { id: 703, title: 'Funkce a pole',                   type: 'lesson', duration: 15, xp: 10 },
                { id: 704, title: 'PDO — databázové operace',        type: 'lesson', duration: 20, xp: 15 },
                { id: 705, title: 'Sessions a cookie autentizace',   type: 'lesson', duration: 18, xp: 15 },
                { id: 706, title: 'OOP — třídy a objekty',           type: 'lesson', duration: 18, xp: 15 },
                { id: 707, title: 'Dědičnost a interfaces',          type: 'lesson', duration: 18, xp: 15 },
                { id: 708, title: 'Traits a namespace',              type: 'lesson', duration: 15, xp: 15 },
                { id: 709, title: 'Výjimky a error handling',        type: 'lesson', duration: 15, xp: 15 },
                { id: 710, title: 'REST API — JSON responses',       type: 'lesson', duration: 20, xp: 15 },
                { id: 711, title: 'Validace vstupu',                 type: 'lesson', duration: 18, xp: 15 },
                { id: 712, title: 'Bezpečný upload souborů',         type: 'lesson', duration: 18, xp: 15 },
                { id: 713, title: 'Praktický projekt — bodový systém', type: 'lesson', duration: 20, xp: 20 },
                { id: 714, title: 'Bezpečnost — XSS, CSRF, CORS',   type: 'lesson', duration: 15, xp: 15 },
                { id: 715, title: 'Apache .htaccess — routing a bezpečnost', type: 'lesson', duration: 12, xp: 15 },
                { id: 716, title: 'Závěrečný kvíz — PHP',           type: 'final_quiz', duration: 25, xp: 200 },
            ]}
        ]
    },
    {
        slug: 'git', title: 'Git & GitHub',
        description: 'Verzovací systém Git od základů — commity, větve, merge, rebase a GitHub workflow.',
        difficulty: 'beginner', xp_reward: 600,
        thumbnail_color: '#f97316', thumbnail_icon: 'git-branch', lesson_count: 16,
        sections: [
            { title: 'Git', lessons: [
                { id: 801, title: 'Co je verzovací systém',          type: 'lesson', duration: 10, xp: 10 },
                { id: 802, title: 'Instalace a konfigurace',         type: 'lesson', duration: 12, xp: 10 },
                { id: 803, title: 'První repozitář a .gitignore',     type: 'lesson', duration: 12, xp: 10 },
                { id: 804, title: 'Staging area a git diff',         type: 'lesson', duration: 12, xp: 10 },
                { id: 805, title: 'Commity a konvence zpráv',        type: 'lesson', duration: 12, xp: 10 },
                { id: 806, title: 'Historie — git log',             type: 'lesson', duration: 12, xp: 10 },
                { id: 807, title: 'Větve — branch, switch, merge',    type: 'lesson', duration: 15, xp: 10 },
                { id: 808, title: 'Merge vs Rebase',                 type: 'lesson', duration: 15, xp: 10 },
                { id: 809, title: 'Konflikty — jak řešit',           type: 'lesson', duration: 15, xp: 10 },
                { id: 810, title: 'Remote — clone, fetch, pull',     type: 'lesson', duration: 12, xp: 10 },
                { id: 811, title: 'GitHub — SSH klíče a push',       type: 'lesson', duration: 12, xp: 10 },
                { id: 812, title: 'Pull Requesty',                   type: 'lesson', duration: 15, xp: 10 },
                { id: 813, title: 'Git Stash a Tags',                type: 'lesson', duration: 12, xp: 10 },
                { id: 814, title: 'GitHub Actions — CI/CD základy',  type: 'lesson', duration: 15, xp: 10 },
                { id: 815, title: 'Git best practices a team workflow', type: 'lesson', duration: 12, xp: 10 },
                { id: 816, title: 'Závěrečný kvíz — Git',           type: 'final_quiz', duration: 20, xp: 100 },
            ]}
        ]
    },
    {
        slug: 'docker', title: 'Docker',
        description: 'Kontejnerizace aplikací — Dockerfile, volumes, networking, Compose a deployment.',
        difficulty: 'intermediate', xp_reward: 700,
        thumbnail_color: '#0ea5e9', thumbnail_icon: 'container', lesson_count: 15,
        sections: [
            { title: 'Docker', lessons: [
                { id: 901, title: 'Co je Docker — kontejnery vs VM', type: 'lesson', duration: 12, xp: 10 },
                { id: 902, title: 'Základní příkazy',                type: 'lesson', duration: 15, xp: 10 },
                { id: 903, title: 'Docker images a Docker Hub',      type: 'lesson', duration: 12, xp: 10 },
                { id: 904, title: 'Dockerfile — instrukce',          type: 'lesson', duration: 18, xp: 10 },
                { id: 905, title: 'Multi-stage builds',              type: 'lesson', duration: 15, xp: 15 },
                { id: 906, title: 'Volumes — persistentní data',     type: 'lesson', duration: 15, xp: 15 },
                { id: 907, title: 'Networking',                      type: 'lesson', duration: 15, xp: 15 },
                { id: 908, title: 'Docker Compose — základy',        type: 'lesson', duration: 20, xp: 15 },
                { id: 909, title: 'Docker Compose — produkce',       type: 'lesson', duration: 20, xp: 15 },
                { id: 910, title: 'PHP + Apache v Dockeru',          type: 'lesson', duration: 18, xp: 15 },
                { id: 911, title: 'MariaDB kontejner',               type: 'lesson', duration: 15, xp: 15 },
                { id: 912, title: 'Bezpečnost kontejnerů',           type: 'lesson', duration: 15, xp: 15 },
                { id: 913, title: 'CI/CD s Dockerem',                type: 'lesson', duration: 15, xp: 15 },
                { id: 914, title: 'docker-compose — více kontejnerů', type: 'lesson', duration: 20, xp: 20 },
                { id: 915, title: 'Závěrečný kvíz — Docker',        type: 'final_quiz', duration: 20, xp: 100 },
            ]}
        ]
    },
    {
        slug: 'java', title: 'Java',
        description: 'Objektově orientovaný jazyk pro backend, Android a enterprise aplikace.',
        difficulty: 'intermediate', xp_reward: 1000,
        thumbnail_color: '#f97316', thumbnail_icon: 'coffee', lesson_count: 16,
        sections: [{ title: 'Java', lessons: [
            { id: 1001, title: 'Úvod do Javy — JVM a HelloWorld',  type: 'lesson', duration: 12, xp: 10 },
            { id: 1002, title: 'Typy, proměnné, operátory',        type: 'lesson', duration: 12, xp: 10 },
            { id: 1003, title: 'OOP — třídy a objekty',            type: 'lesson', duration: 18, xp: 15 },
            { id: 1004, title: 'Dědičnost a interfaces',           type: 'lesson', duration: 18, xp: 15 },
            { id: 1005, title: 'Collections — ArrayList, HashMap', type: 'lesson', duration: 18, xp: 15 },
            { id: 1006, title: 'Generika',                         type: 'lesson', duration: 18, xp: 15 },
            { id: 1007, title: 'Streams API',                      type: 'lesson', duration: 20, xp: 15 },
            { id: 1008, title: 'Optional a null safety',           type: 'lesson', duration: 15, xp: 15 },
            { id: 1009, title: 'Records a Sealed Classes',         type: 'lesson', duration: 15, xp: 15 },
            { id: 1010, title: 'Výjimky',                          type: 'lesson', duration: 15, xp: 15 },
            { id: 1011, title: 'Lambda a Method References',       type: 'lesson', duration: 18, xp: 15 },
            { id: 1012, title: 'CompletableFuture a async',        type: 'lesson', duration: 20, xp: 15 },
            { id: 1013, title: 'JDBC a databáze',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1014, title: 'Spring Boot intro',                type: 'lesson', duration: 20, xp: 15 },
            { id: 1015, title: 'JUnit 5 testování',                type: 'lesson', duration: 18, xp: 15 },
            { id: 1016, title: 'Závěrečný kvíz — Java',           type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
    {
        slug: 'csharp', title: 'C#',
        description: 'Moderní .NET jazyk pro webové API, hry v Unity a desktopové aplikace.',
        difficulty: 'intermediate', xp_reward: 1000,
        thumbnail_color: '#a855f7', thumbnail_icon: 'hash', lesson_count: 14,
        sections: [{ title: 'C#', lessons: [
            { id: 1101, title: 'Úvod do C# a .NET',               type: 'lesson', duration: 12, xp: 10 },
            { id: 1102, title: 'Typy a string interpolace',        type: 'lesson', duration: 12, xp: 10 },
            { id: 1103, title: 'OOP — třídy a properties',         type: 'lesson', duration: 18, xp: 15 },
            { id: 1104, title: 'Generika a Interfaces',            type: 'lesson', duration: 18, xp: 15 },
            { id: 1105, title: 'LINQ pokročile',                   type: 'lesson', duration: 20, xp: 15 },
            { id: 1106, title: 'Records a Pattern Matching',       type: 'lesson', duration: 18, xp: 15 },
            { id: 1107, title: 'async/await a Task',               type: 'lesson', duration: 18, xp: 15 },
            { id: 1108, title: 'Dependency Injection',             type: 'lesson', duration: 20, xp: 15 },
            { id: 1109, title: 'Entity Framework Core',            type: 'lesson', duration: 20, xp: 15 },
            { id: 1110, title: 'ASP.NET Core Minimal API',         type: 'lesson', duration: 20, xp: 15 },
            { id: 1111, title: 'xUnit testování',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1112, title: 'Span<T> a performance',            type: 'lesson', duration: 15, xp: 15 },
            { id: 1113, title: 'Docker deployment',                type: 'lesson', duration: 15, xp: 15 },
            { id: 1114, title: 'Závěrečný kvíz — C#',             type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
    {
        slug: 'cpp', title: 'C++',
        description: 'Výkonný systémový jazyk — smart pointers, templates, STL a herní engine základy.',
        difficulty: 'advanced', xp_reward: 1200,
        thumbnail_color: '#ef4444', thumbnail_icon: 'zap', lesson_count: 13,
        sections: [{ title: 'C++', lessons: [
            { id: 1201, title: 'Úvod do C++ — kompilace',          type: 'lesson', duration: 15, xp: 10 },
            { id: 1202, title: 'Ukazatele a správa paměti',        type: 'lesson', duration: 20, xp: 15 },
            { id: 1203, title: 'Třídy a OOP',                      type: 'lesson', duration: 18, xp: 15 },
            { id: 1204, title: 'Smart pointers (RAII)',             type: 'lesson', duration: 18, xp: 15 },
            { id: 1205, title: 'STL kontejnery',                   type: 'lesson', duration: 18, xp: 15 },
            { id: 1206, title: 'Templates a Concepts',             type: 'lesson', duration: 20, xp: 15 },
            { id: 1207, title: 'Move semantics',                   type: 'lesson', duration: 18, xp: 15 },
            { id: 1208, title: 'Lambda výrazy',                    type: 'lesson', duration: 15, xp: 15 },
            { id: 1209, title: 'Ranges a algoritmy C++20',         type: 'lesson', duration: 18, xp: 15 },
            { id: 1210, title: 'Concurrency — thread a future',    type: 'lesson', duration: 20, xp: 15 },
            { id: 1211, title: 'WebAssembly s Emscripten',         type: 'lesson', duration: 15, xp: 15 },
            { id: 1212, title: 'Herní engine architektura',        type: 'lesson', duration: 25, xp: 20 },
            { id: 1213, title: 'Závěrečný kvíz — C++',            type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
    {
        slug: 'rust', title: 'Rust',
        description: 'Systémový jazyk s pamětí bezpečností — ownership, traits, async a Tauri.',
        difficulty: 'advanced', xp_reward: 1200,
        thumbnail_color: '#f97316', thumbnail_icon: 'shield', lesson_count: 14,
        sections: [{ title: 'Rust', lessons: [
            { id: 1301, title: 'Úvod do Rustu — Cargo',            type: 'lesson', duration: 15, xp: 10 },
            { id: 1302, title: 'Ownership a Borrowing',            type: 'lesson', duration: 20, xp: 15 },
            { id: 1303, title: 'Structs a Enums',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1304, title: 'Result a Option',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1305, title: 'Traits',                           type: 'lesson', duration: 18, xp: 15 },
            { id: 1306, title: 'Lifetimes',                        type: 'lesson', duration: 20, xp: 15 },
            { id: 1307, title: 'Iterátory a closures',             type: 'lesson', duration: 18, xp: 15 },
            { id: 1308, title: 'async/await s Tokio',              type: 'lesson', duration: 20, xp: 15 },
            { id: 1309, title: 'Serde — serializace',              type: 'lesson', duration: 15, xp: 15 },
            { id: 1310, title: 'SQLx — databáze',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1311, title: 'Actix-web REST API',               type: 'lesson', duration: 20, xp: 15 },
            { id: 1312, title: 'Tauri 2.0 — desktopová aplikace', type: 'lesson', duration: 20, xp: 20 },
            { id: 1313, title: 'WebAssembly — wasm-bindgen',       type: 'lesson', duration: 15, xp: 15 },
            { id: 1314, title: 'Závěrečný kvíz — Rust',           type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
    {
        slug: 'golang', title: 'Go',
        description: 'Jednoduchý a výkonný jazyk pro backend, CLI nástroje a cloudové systémy.',
        difficulty: 'intermediate', xp_reward: 1000,
        thumbnail_color: '#06b6d4', thumbnail_icon: 'layers', lesson_count: 14,
        sections: [{ title: 'Go', lessons: [
            { id: 1401, title: 'Úvod do Go — go mod',             type: 'lesson', duration: 12, xp: 10 },
            { id: 1402, title: 'Funkce a více návratových hodnot', type: 'lesson', duration: 15, xp: 10 },
            { id: 1403, title: 'Structs a Interfaces',             type: 'lesson', duration: 18, xp: 15 },
            { id: 1404, title: 'Error handling',                   type: 'lesson', duration: 15, xp: 15 },
            { id: 1405, title: 'Goroutines a WaitGroup',           type: 'lesson', duration: 18, xp: 15 },
            { id: 1406, title: 'Channels a select',                type: 'lesson', duration: 20, xp: 15 },
            { id: 1407, title: 'HTTP server — net/http',           type: 'lesson', duration: 20, xp: 15 },
            { id: 1408, title: 'Gin framework',                    type: 'lesson', duration: 20, xp: 15 },
            { id: 1409, title: 'Databáze — sqlx',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1410, title: 'Testování — table-driven',         type: 'lesson', duration: 18, xp: 15 },
            { id: 1411, title: 'Generika (Go 1.18+)',              type: 'lesson', duration: 18, xp: 15 },
            { id: 1412, title: 'Docker — scratch image',           type: 'lesson', duration: 15, xp: 15 },
            { id: 1413, title: 'Kompletní microservice',           type: 'lesson', duration: 25, xp: 20 },
            { id: 1414, title: 'Závěrečný kvíz — Go',             type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
    {
        slug: 'kotlin', title: 'Kotlin',
        description: 'Moderní JVM jazyk pro Android, backend (Ktor) a multiplatformní aplikace.',
        difficulty: 'intermediate', xp_reward: 900,
        thumbnail_color: '#a855f7', thumbnail_icon: 'smartphone', lesson_count: 12,
        sections: [{ title: 'Kotlin', lessons: [
            { id: 1501, title: 'Úvod do Kotlinu',                  type: 'lesson', duration: 12, xp: 10 },
            { id: 1502, title: 'Data classes a extension functions',type: 'lesson', duration: 15, xp: 15 },
            { id: 1503, title: 'Null safety pokročile',            type: 'lesson', duration: 15, xp: 15 },
            { id: 1504, title: 'Sealed classes a when',            type: 'lesson', duration: 18, xp: 15 },
            { id: 1505, title: 'Coroutines — základy',             type: 'lesson', duration: 18, xp: 15 },
            { id: 1506, title: 'Flow — reaktivní streamy',         type: 'lesson', duration: 20, xp: 15 },
            { id: 1507, title: 'Android — ViewModel a Compose',    type: 'lesson', duration: 20, xp: 15 },
            { id: 1508, title: 'Ktor — REST API',                  type: 'lesson', duration: 20, xp: 15 },
            { id: 1509, title: 'Exposed ORM',                      type: 'lesson', duration: 18, xp: 15 },
            { id: 1510, title: 'Testování — MockK',                type: 'lesson', duration: 18, xp: 15 },
            { id: 1511, title: 'Kotlin Multiplatform',             type: 'lesson', duration: 18, xp: 15 },
            { id: 1512, title: 'Závěrečný kvíz — Kotlin',         type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
    {
        slug: 'swift', title: 'Swift',
        description: 'Apple jazyk pro iOS, macOS a server-side vývoj s SwiftUI a async/await.',
        difficulty: 'intermediate', xp_reward: 900,
        thumbnail_color: '#f97316', thumbnail_icon: 'triangle', lesson_count: 12,
        sections: [{ title: 'Swift', lessons: [
            { id: 1601, title: 'Úvod do Swiftu',                   type: 'lesson', duration: 12, xp: 10 },
            { id: 1602, title: 'Structs vs Classes',               type: 'lesson', duration: 15, xp: 15 },
            { id: 1603, title: 'Enums a pattern matching',         type: 'lesson', duration: 18, xp: 15 },
            { id: 1604, title: 'Optionals — guard let, if let',    type: 'lesson', duration: 15, xp: 15 },
            { id: 1605, title: 'Protokoly a POP',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1606, title: 'async/await a Actor',              type: 'lesson', duration: 18, xp: 15 },
            { id: 1607, title: 'SwiftUI — základy',                type: 'lesson', duration: 20, xp: 15 },
            { id: 1608, title: 'SwiftUI — state management',       type: 'lesson', duration: 20, xp: 15 },
            { id: 1609, title: 'URLSession a Codable',             type: 'lesson', duration: 18, xp: 15 },
            { id: 1610, title: 'Testování — XCTest',               type: 'lesson', duration: 15, xp: 15 },
            { id: 1611, title: 'Vapor — Swift backend',            type: 'lesson', duration: 18, xp: 15 },
            { id: 1612, title: 'Závěrečný kvíz — Swift',          type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
    {
        slug: 'ruby', title: 'Ruby',
        description: 'Elegantní dynamický jazyk — metaprogramování, Rails a konvence nad konfigurací.',
        difficulty: 'intermediate', xp_reward: 800,
        thumbnail_color: '#ef4444', thumbnail_icon: 'gem', lesson_count: 12,
        sections: [{ title: 'Ruby', lessons: [
            { id: 1701, title: 'Úvod do Ruby',                     type: 'lesson', duration: 12, xp: 10 },
            { id: 1702, title: 'Bloky, Procs a Lambdy',            type: 'lesson', duration: 18, xp: 15 },
            { id: 1703, title: 'OOP — třídy a moduly',             type: 'lesson', duration: 18, xp: 15 },
            { id: 1704, title: 'Metaprogramování',                 type: 'lesson', duration: 20, xp: 15 },
            { id: 1705, title: 'Ruby on Rails — úvod',             type: 'lesson', duration: 20, xp: 15 },
            { id: 1706, title: 'ActiveRecord',                     type: 'lesson', duration: 20, xp: 15 },
            { id: 1707, title: 'Rails Controllers a Routes',       type: 'lesson', duration: 20, xp: 15 },
            { id: 1708, title: 'Rails API mode',                   type: 'lesson', duration: 18, xp: 15 },
            { id: 1709, title: 'RSpec testování',                  type: 'lesson', duration: 18, xp: 15 },
            { id: 1710, title: 'Sidekiq — background jobs',        type: 'lesson', duration: 15, xp: 15 },
            { id: 1711, title: 'Docker pro Rails',                 type: 'lesson', duration: 15, xp: 15 },
            { id: 1712, title: 'Závěrečný kvíz — Ruby',           type: 'final_quiz', duration: 25, xp: 200 },
        ]}]
    },
];

// Helper — find course by lesson ID
export function findCourseByLessonId(lessonId) {
    const id = parseInt(lessonId);
    for (const course of MOCK_COURSES) {
        for (const section of course.sections) {
            if (section.lessons.some(l => l.id === id)) return course;
        }
    }
    return null;
}

// Helper — get all lessons flat for a course slug
export function getMockLessons(slug) {
    const course = MOCK_COURSES.find(c => c.slug === slug);
    if (!course) return [];
    return course.sections.flatMap(s =>
        s.lessons.map(l => ({ ...l, section: s.title }))
    );
}

// Helper — get mock lesson by ID
export function getMockLesson(id) {
    const numId = parseInt(id);
    for (const course of MOCK_COURSES) {
        for (const section of course.sections) {
            const lesson = section.lessons.find(l => l.id === numId);
            if (lesson) return { ...lesson, course, section: section.title };
        }
    }
    return null;
}

// Helper — get mock quiz questions for any quiz lesson
export function getMockQuizQuestions(lessonId) {
    return [
        {
            id: lessonId * 100 + 1,
            question: 'Která možnost je správná?',
            option_a: 'Odpověď A',
            option_b: 'Odpověď B',
            option_c: 'Odpověď C',
            option_d: 'Odpověď D',
            correct_answer: 'a',
            explanation: 'Toto je ukázková otázka. Skutečné otázky se načítají z API serveru.'
        },
        {
            id: lessonId * 100 + 2,
            question: 'Co je hlavní výhodou tohoto konceptu?',
            option_a: 'Rychlost',
            option_b: 'Bezpečnost',
            option_c: 'Čitelnost kódu',
            option_d: 'Kompatibilita',
            correct_answer: 'c',
            explanation: 'Čitelnost kódu je klíčová pro údržbu a spolupráci v týmu.'
        },
        {
            id: lessonId * 100 + 3,
            question: 'Který příkaz použiješ pro kontrolu chyb?',
            option_a: 'try/catch',
            option_b: 'if/else',
            option_c: 'switch',
            option_d: 'for loop',
            correct_answer: 'a',
            explanation: 'try/catch (nebo try/except) je standardní způsob zachycení chyb.'
        },
        {
            id: lessonId * 100 + 4,
            question: 'Co znamená zkratka DRY?',
            option_a: 'Do Repeat Yourself',
            option_b: "Don't Repeat Yourself",
            option_c: 'Debug Regularly Yet',
            option_d: 'Deploy Rapidly Yesterday',
            correct_answer: 'b',
            explanation: "DRY — Don't Repeat Yourself — zásada vyhnout se duplicitě v kódu."
        },
    ];
}

// Search items for homepage
export const SITE_ITEMS = [
    { type: 'kurz', title: 'Python', desc: 'Nejpopulárnější jazyk pro začátečníky', slug: 'python' },
    { type: 'kurz', title: 'JavaScript', desc: 'Jazyk webového frontendu i backendu', slug: 'javascript' },
    { type: 'kurz', title: 'HTML & CSS', desc: 'Základ každého webu', slug: 'html-css' },
    { type: 'kurz', title: 'SQL & Databáze', desc: 'Práce s databázemi', slug: 'sql' },
    { type: 'kurz', title: 'TypeScript', desc: 'JavaScript s typy', slug: 'typescript' },
    { type: 'kurz', title: 'PHP', desc: 'Serverový jazyk pro web', slug: 'php' },
    { type: 'kurz', title: 'Java', desc: 'Enterprise aplikace', slug: 'java' },
    { type: 'kurz', title: 'C#', desc: '.NET ekosystém', slug: 'csharp' },
    { type: 'kurz', title: 'C++', desc: 'Výkon blízko kovu', slug: 'cpp' },
    { type: 'kurz', title: 'Rust', desc: 'Bezpečnost paměti', slug: 'rust' },
    { type: 'kurz', title: 'Go', desc: 'Cloud-native nástroje', slug: 'golang' },
    { type: 'kurz', title: 'Kotlin', desc: 'Android a backend', slug: 'kotlin' },
    { type: 'kurz', title: 'Swift', desc: 'iOS a macOS', slug: 'swift' },
    { type: 'kurz', title: 'Ruby', desc: 'Ruby on Rails', slug: 'ruby' },
    { type: 'kurz', title: 'Git & GitHub', desc: 'Verzování kódu', slug: 'git' },
    { type: 'kurz', title: 'Docker', desc: 'Kontejnerizace', slug: 'docker' },
];
