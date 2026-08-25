-- Python missing lessons (sort_order 39-61)
-- Import to phpMyAdmin manually

SET @kurs_id = (SELECT id FROM courses WHERE slug = 'python');

-- Sekce 4 — Praktický Python (sort_order 39-52, xp_reward=15)
INSERT INTO lessons (course_id, title, content, lesson_type, xp_reward, sort_order, duration) VALUES
(@kurs_id, 'pip a správa balíčků', '<h2>pip a správa balíčků</h2><p>Python používá pip pro instalaci balíčků z PyPI. Vždy pracuj ve virtuálním prostředí, aby se balíčky nekolizeovaly s globální instalací.</p><pre><code>python -m venv venv\nsource venv/bin/activate  # Linux/Mac\nvenv\\Scripts\\activate   # Windows\npip install requests\npip freeze > requirements.txt\npip install -r requirements.txt</code></pre>', 'lesson', 15, 39, 18),

(@kurs_id, 'requests — HTTP klient', '<h2>requests — HTTP klient</h2><p>Knihovna requests zjednodušuje HTTP požadavky. Podporuje GET/POST, hlavičky, JSON, sessions a timeout.</p><pre><code>import requests\n\nres = requests.get(''https://api.example.com/data'',\n    headers={''Accept'': ''application/json''},\n    timeout=10)\nres.raise_for_status()\ndata = res.json()</code></pre>', 'lesson', 15, 40, 18),

(@kurs_id, 'Web scraping', '<h2>Web scraping</h2><p>Kombinace requests a BeautifulSoup umožňuje extrahovat data z HTML. Respektuj robots.txt a nepřetěžuj server.</p><pre><code>from bs4 import BeautifulSoup\nimport requests\n\nres = requests.get(''https://example.com'')\nsoup = BeautifulSoup(res.text, ''html.parser'')\ntitles = soup.select(''h2.article-title'')\nfor t in titles:\n    print(t.get_text())</code></pre>', 'lesson', 15, 41, 20),

(@kurs_id, 'Flask — úvod', '<h2>Flask — úvod</h2><p>Flask je lehký webový framework. Vytvoříš route, zpracuješ request a vrátíš JSON odpověď.</p><pre><code>from flask import Flask, request, jsonify\n\napp = Flask(__name__)\n\n@app.route(''/api/hello'')\ndef hello():\n    name = request.args.get(''name'', ''World'')\n    return jsonify({''message'': f''Hello {name}!''})\n\napp.run(debug=True)</code></pre>', 'lesson', 15, 42, 20),

(@kurs_id, 'Flask Blueprint', '<h2>Flask Blueprint</h2><p>Blueprint umožňuje rozdělit aplikaci do modulů. Každý blueprint má vlastní routes a lze ho registrovat s prefixem.</p><pre><code>from flask import Blueprint\n\nusers = Blueprint(''users'', __name__, url_prefix=''/users'')\n\n@users.route(''/'')\ndef list_users():\n    return jsonify([])\n\n@users.route(''/<int:id>'')\ndef get_user(id):\n    return jsonify({''id'': id})</code></pre>', 'lesson', 15, 43, 18),

(@kurs_id, 'REST API s Flaskem', '<h2>REST API s Flaskem</h2><p>REST API používá HTTP metody GET/POST/PUT/DELETE. Validuj vstup a vracej správné status kódy.</p><pre><code>@app.route(''/items'', methods=[''POST''])\ndef create_item():\n    data = request.get_json()\n    if not data or ''name'' not in data:\n        return jsonify({''error'': ''Name required''}), 400\n    return jsonify({''id'': 1, ''name'': data[''name'']}), 201</code></pre>', 'lesson', 15, 44, 20),

(@kurs_id, 'Pandas', '<h2>Pandas</h2><p>Pandas je knihovna pro analýzu dat. DataFrame je tabulková struktura s mocnými metodami pro filtrování a agregaci.</p><pre><code>import pandas as pd\n\ndf = pd.read_csv(''data.csv'')\nprint(df.head())\nprint(df.describe())\nfiltered = df[df[''age''] > 25]\ngrouped = df.groupby(''category'')[''price''].mean()</code></pre>', 'lesson', 15, 45, 20),

(@kurs_id, 'NumPy', '<h2>NumPy</h2><p>NumPy poskytuje efektivní pole (arrays) a matematické operace. Broadcasting umožňuje operace nad poli různých tvarů.</p><pre><code>import numpy as np\n\na = np.array([1, 2, 3, 4])\nb = np.linspace(0, 1, 5)\nc = a.reshape(2, 2)\nprint(a * 2)\nprint(c.shape)</code></pre>', 'lesson', 15, 46, 18),

(@kurs_id, 'Matplotlib', '<h2>Matplotlib</h2><p>Matplotlib je základní knihovna pro vizualizaci dat. Podporuje čárové, sloupcové a histogramové grafy.</p><pre><code>import matplotlib.pyplot as plt\n\nx = [1, 2, 3, 4]\ny = [10, 20, 15, 30]\nplt.plot(x, y)\nplt.xlabel(''X'')\nplt.ylabel(''Y'')\nplt.title(''Graf'')\nplt.savefig(''chart.png'')</code></pre>', 'lesson', 15, 47, 18),

(@kurs_id, 'threading', '<h2>threading</h2><p>Threading umožňuje paralelní běh vláken. Použij Lock pro synchronizaci a Queue pro bezpečnou komunikaci.</p><pre><code>import threading\n\nlock = threading.Lock()\n\ndef worker(items):\n    with lock:\n        for item in items:\n            process(item)\n\nt = threading.Thread(target=worker, args=([1,2,3],))\nt.start()\nt.join()</code></pre>', 'lesson', 15, 48, 18),

(@kurs_id, 'subprocess', '<h2>subprocess</h2><p>subprocess umožňuje spouštět externí příkazy z Pythonu. capture_output zachytí stdout i stderr.</p><pre><code>import subprocess\n\nresult = subprocess.run(\n    [''ls'', ''-la''],\n    capture_output=True, text=True\n)\nprint(result.stdout)\nprint(result.returncode)</code></pre>', 'lesson', 15, 49, 15),

(@kurs_id, 'logging', '<h2>logging</h2><p>Modul logging poskytuje flexibilní logování s úrovněmi DEBUG, INFO, WARNING, ERROR a CRITICAL.</p><pre><code>import logging\n\nlogging.basicConfig(\n    level=logging.INFO,\n    format=''%(asctime)s %(levelname)s %(message)s''\n)\nlogging.info(''Aplikace spuštěna'')\nlogging.error(''Chyba při zpracování'')</code></pre>', 'lesson', 15, 50, 15),

(@kurs_id, 'argparse', '<h2>argparse — CLI argumenty</h2><p>argparse umožňuje snadno vytvořit CLI rozhraní s povinnými i volitelnými argumenty.</p><pre><code>import argparse\n\nparser = argparse.ArgumentParser(description=''Nástroj'')\nparser.add_argument(''name'', help=''Jméno'')\nparser.add_argument(''-v'', ''--verbose'', action=''store_true'')\nargs = parser.parse_args()\nprint(f''Hello {args.name}!'')</code></pre>', 'lesson', 15, 51, 15),

(@kurs_id, '.env a konfigurace', '<h2>.env a konfigurace</h2><p>python-dotenv načte proměnné z .env souboru. Nikdy neukládej tajemství v kódu — použij environment variables.</p><pre><code>from dotenv import load_dotenv\nimport os\n\nload_dotenv()\ndb_host = os.getenv(''DB_HOST'')\nsecret = os.getenv(''APP_SECRET'')</code></pre>', 'lesson', 15, 52, 15),

-- Kvíz 4 (sort_order 53)
(@kurs_id, 'Kvíz 4 — Praktický Python', '<h2>Kvíz 4 — Praktický Python</h2><p>Otestuj své znalosti z praktických Python témat: requests, Flask, pandas, threading a subprocess.</p>', 'quiz', 50, 53, 15),

-- Sekce 5 — Projekty (sort_order 54-60, xp_reward=20)
(@kurs_id, 'Projekt: CLI Todo aplikace', '<h2>Projekt: CLI Todo aplikace</h2><p>Vytvoř todo aplikaci v terminálu pomocí argparse a JSON souboru. Implementuj přidání, výpis, smazání a označení úkolu jako hotového.</p><pre><code>import argparse, json\n\ndef add_task(tasks, title):\n    tasks.append({''title'': title, ''done'': False})\n    save_tasks(tasks)</code></pre>', 'lesson', 20, 54, 40),

(@kurs_id, 'Projekt: CSV Analyzér', '<h2>Projekt: CSV Analyzér</h2><p>Načti CSV pomocí pandas, spočítej základní statistiky, filtruj data a exportuj výsledky do nového souboru.</p><pre><code>import pandas as pd\n\ndf = pd.read_csv(''sales.csv'')\nprint(df.describe())\nfiltered = df[df[''amount''] > 100]\nfiltered.to_csv(''filtered.csv'', index=False)</code></pre>', 'lesson', 20, 55, 40),

(@kurs_id, 'Projekt: REST API', '<h2>Projekt: REST API</h2><p>Postav REST API s Flaskem a SQLite. Vytvoř CRUD endpointy pro správu záznamů s JSON odpověďmi.</p><pre><code>@app.route(''/items'', methods=[''GET''])\ndef get_items():\n    items = db.execute(''SELECT * FROM items'').fetchall()\n    return jsonify(items)</code></pre>', 'lesson', 20, 56, 45),

(@kurs_id, 'Projekt: File Organizer', '<h2>Projekt: File Organizer</h2><p>Vytvoř skript, který roztřídí soubory ve složce podle přípony do podsložek. Použij pathlib a shutil.</p><pre><code>from pathlib import Path\nimport shutil\n\nfor f in Path(''downloads'').iterdir():\n    ext = f.suffix.lower().strip(''.'')\n    dest = Path(''sorted'') / ext\n    dest.mkdir(exist_ok=True)\n    shutil.move(str(f), dest / f.name)</code></pre>', 'lesson', 20, 57, 35),

(@kurs_id, 'Projekt: Web Scraper', '<h2>Projekt: Web Scraper</h2><p>Napiš scraper, který stáhne data z webu a uloží je do CSV. Zpracuj chyby a dodržuj etická pravidla.</p><pre><code>import csv, requests\nfrom bs4 import BeautifulSoup\n\nres = requests.get(url, timeout=10)\nsoup = BeautifulSoup(res.text, ''html.parser'')\nwith open(''output.csv'', ''w'') as f:\n    writer = csv.writer(f)\n    writer.writerow([''title'', ''link''])</code></pre>', 'lesson', 20, 58, 40),

(@kurs_id, 'Projekt: Datová vizualizace', '<h2>Projekt: Datová vizualizace</h2><p>Vizualizuj reálný dataset pomocí pandas a matplotlib. Vytvoř grafy s popisky a ulož je jako obrázky.</p><pre><code>import pandas as pd\nimport matplotlib.pyplot as plt\n\ndf = pd.read_csv(''data.csv'')\ndf[''value''].hist(bins=20)\nplt.title(''Distribuce hodnot'')\nplt.savefig(''histogram.png'')</code></pre>', 'lesson', 20, 59, 40),

(@kurs_id, 'Python roadmapa', '<h2>Python roadmapa</h2><p>Kam dál po zvládnutí základů? Prozkoumej frameworky (Django, FastAPI), datovou analýzu, automatizaci a cloudové služby.</p><pre><code># Další kroky:\n# - Django / FastAPI pro web\n# - Jupyter pro analýzu dat\n# - Celery pro asynchronní úlohy\n# - Docker pro nasazení\n# - Testování s pytest</code></pre>', 'lesson', 20, 60, 15),

-- Závěrečný kvíz (sort_order 61)
(@kurs_id, 'Závěrečný kvíz — Celý Python kurz', '<h2>Závěrečný kvíz</h2><p>Obsáhlý kvíz pokrývající všechny sekce Python kurzu — od základů po projekty.</p>', 'final_quiz', 200, 61, 25);

-- Update lesson count
UPDATE courses SET lesson_count = (SELECT COUNT(*) FROM lessons WHERE course_id = @kurs_id) WHERE id = @kurs_id;