# DEPLOY.md — Průvodce nasazením edu.vevit.fun

## 1. Databázový setup

### Pořadí importu SQL souborů přes phpMyAdmin

Importuj v tomto pořadí (každý soubor samostatně):

1. `01_schema.sql` — vytvoří tabulky (courses, lessons, quizzes, user_progress)
2. `02_courses.sql` — vloží 18 kurzů
3. `03_python_course.sql` — Python lekce + kvízy
4. `04_javascript_course.sql` — JavaScript lekce + kvízy
5. `05_htmlcss_course.sql` — HTML & CSS lekce + kvízy
6. `06_sql_course.sql` — SQL lekce + kvízy
7. `07_zaklady_terminal.sql` — Základy programování + Terminál & Bash
8. `08_typescript_course.sql` — TypeScript
9. `09_php_course.sql` — PHP
10. `10_java_course.sql` — Java
11. `11_csharp_course.sql` — C#
12. `12_cpp_course.sql` — C++
13. `13_rust_course.sql` — Rust
14. `14_go_course.sql` — Go
15. `15_kotlin_course.sql` — Kotlin
16. `16_swift_course.sql` — Swift
17. `17_ruby_course.sql` — Ruby
18. `18_git_course.sql` — Git & GitHub
19. `19_docker_course.sql` — Docker

### Ověření importu

Po importu spusť v phpMyAdmin SQL:

```sql
-- Celkový počet kurzů
SELECT COUNT(*) FROM courses;  -- Očekáváno: 18

-- Celkový počet lekcí
SELECT COUNT(*) FROM lessons;  -- Očekáváno: ~497

-- Celkový počet otázek v kvízech
SELECT COUNT(*) FROM quizzes;  -- Očekáváno: ~150+

-- Lekce po kurzech
SELECT c.title, COUNT(l.id) as lekci
FROM courses c LEFT JOIN lessons l ON c.id = l.course_id
GROUP BY c.id ORDER BY c.sort_order;
```

---

## 2. Nahrání souborů na Wedos

### FTP struktura

```
/www/edu.vevit.fun/
├── index.html          — SPA entry point
├── .htaccess           — API routing + SPA fallback
├── api/
│   ├── config.php      — DB připojení + helpery
│   ├── auth.php        — Cookie autentizace
│   ├── kurzy.php       — GET /api/kurzy, /api/kurzy/{slug}
│   ├── lekce.php       — GET /api/lekce/{id}, POST /api/progress
│   ├── kviz.php        — GET /api/kviz/{id}
│   └── leaderboard.php — GET /api/leaderboard
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── router.js
│   ├── pages/
│   │   ├── home.js
│   │   ├── courses.js
│   │   ├── course.js
│   │   ├── lesson.js
│   │   ├── quiz.js
│   │   └── wiki.js
│   └── shared/
│       ├── mockData.js
│       └── api.js
├── css/
│   └── custom.css
└── database/           — SQL soubory (NE na serveru, jen lokálně)
```

**Důležité:** Složku `database/` nenahrávej na produkci — obsahuje SQL soubory.

---

## 3. Konfigurace

### api/config.php — DB credentials

Otevři `api/config.php` a nastav hesla:

```php
// Edu DB
$pdo = new PDO(
    'mysql:host=md396.wedos.net;port=3306;dbname=d390994_edu;charset=utf8',
    'd390994_edu',
    'TVUJE_HESLO_K_EDU_DB',  // ← ZMĚŇ
    ...
);

// Account DB
$pdo = new PDO(
    'mysql:host=md396.wedos.net;port=3306;dbname=d390994_account;charset=utf8',
    'd390994_account',
    'TVUJE_HESLO_K_ACCOUNT_DB',  // ← ZMĚŇ
    ...
);
```

### CORS origins

V `config.php` je CORS povolen pro:
- `*.vevit.fun` domény
- `http://localhost:5500` (Live Server)

Pokud potřebuješ další domény, uprav regex v `config.php`.

---

## 4. Ověření

### Testovací GET requesty (curl)

```bash
# Seznam kurzů
curl https://edu.vevit.fun/api/kurzy

# Detail kurzu Python
curl https://edu.vevit.fun/api/kurzy/python

# Detail lekce (ID 1)
curl https://edu.vevit.fun/api/lekce/1

# Kvíz pro lekci 19
curl https://edu.vevit.fun/api/kviz/19

# Leaderboard
curl https://edu.vevit.fun/api/leaderboard
```

Očekávaná odpověď:
```json
{"ok": true, "data": [...]}
```

### Co zkontrolovat v browseru

1. **Network tab** — API vrací `200 OK` s `Content-Type: application/json`
2. **Console** — žádné CORS chyby (pokud přistupuješ z *.vevit.fun)
3. **SPA routing** — přímé URL jako `/kurz/python` vrací index.html (ne 404)
4. **Cookie auth** — po přihlášení na account.vevit.fun je cookie `vevit_auth` dostupná

### Progress test (s cookie)

```bash
curl -X POST https://edu.vevit.fun/api/progress \
  -H "Content-Type: application/json" \
  -H "Cookie: vevit_auth=..." \
  -d '{"lesson_id": 1}'
```

Očekávaná odpověď:
```json
{"ok": true, "data": {"xp_ziskano": 10, "xp_celkem": 110, "level": 2, "level_up": false}}
```

---

## 5. Časté problémy na Wedos

### PHP verze

Wedos defaultně používá starší PHP. Ověř verzi:

```bash
curl -I https://edu.vevit.fun/api/kurzy | grep X-Powered-By
```

Pokud je PHP < 7.4, přidej do `.htaccess`:

```apache
AddHandler application/x-httpd-php82 .php
```

Nebo nastav v Wedos administraci → Web → Verze PHP.

### PDO extension

Pokud dostaneš chybu "Class PDO not found":

```bash
php -m | grep pdo
```

Na Wedosu by mělo být `pdo_mysql` dostupné. Pokud ne, kontaktuj podporu.

### .htaccess AllowOverride

Pokud API routy nefungují (404 nebo 500):

1. Ověř, že `.htaccess` je v `/www/edu.vevit.fun/`
2. Wedos musí mít `AllowOverride All` pro tento adresář
3. Zkontroluj error log: `/var/log/apache2/error.log` nebo Wedos admin → Logy

### Charset problémy

Pokud se česká diakritika zobrazuje špatně:

1. DB tabulky musí být `utf8_czech_ci` (ne `utf8mb4` — MariaDB 10.4 na Wedosu má s tím problémy)
2. PDO připojení má `charset=utf8`
3. PHP hlavička `Content-Type: application/json; charset=utf-8` v config.php

### SQL soubory s apostrofy

Pokud import SQL hlásí chybu na apostrofech:

- Všechny SQL soubory používají `''` (dvojitý apostrof) pro escapování
- Importuj přes phpMyAdmin → Import (ne přes copy-paste do SQL okna)
- Nastav Character set: `utf8` při importu