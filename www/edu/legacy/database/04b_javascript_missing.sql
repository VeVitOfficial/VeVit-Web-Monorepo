-- JavaScript missing lessons (sort_order 33-63)
-- Import to phpMyAdmin manually

SET @kurs_id = (SELECT id FROM courses WHERE slug = 'javascript');

-- Sekce 3 — Browser APIs (sort_order 33-42, xp_reward=15)
INSERT INTO lessons (course_id, title, content, lesson_type, xp_reward, sort_order, duration) VALUES
(@kurs_id, 'Intersection Observer', '<h2>Intersection Observer</h2><p>Intersection Observer sleduje, kdy prvek vstoupí do viewportu. Ideální pro lazy loading a animace při scrollu.</p><pre><code>const observer = new IntersectionObserver((entries) => {\n  entries.forEach(e => {\n    if (e.isIntersecting) {\n      e.target.classList.add(''visible'');\n      observer.unobserve(e.target);\n    }\n  });\n});\nobserver.observe(document.querySelector(''.card''));</code></pre>', 'lesson', 15, 33, 18),

(@kurs_id, 'Service Workers', '<h2>Service Workers</h2><p>Service Worker běží na pozadí a umožňuje offline přístup, cacheování a push notifikace. Registruj ho v hlavním vlákně.</p><pre><code>navigator.serviceWorker.register(''/sw.js'')\n  .then(reg => console.log(''Registered'', reg.scope));\n\n// sw.js\nself.addEventListener(''fetch'', e => {\n  e.respondWith(caches.match(e.request));\n});</code></pre>', 'lesson', 15, 34, 20),

(@kurs_id, 'PWA — Progressive Web App', '<h2>PWA</h2><p>PWA přidává do webu nativní funkce — instalaci, offline podporu a push notifikace. Vyžaduje manifest.json a service worker.</p><pre><code>{\n  "name": "Moje Aplikace",\n  "start_url": "/",\n  "display": "standalone",\n  "background_color": "#0d0d0d",\n  "icons": [{"src": "/icon.png", "sizes": "192x192"}]\n}</code></pre>', 'lesson', 15, 35, 18),

(@kurs_id, 'Canvas API', '<h2>Canvas API</h2><p>Canvas umožňuje kreslit 2D grafiku — tvary, text, obrázky i animace přímo v prohlížeči.</p><pre><code>const canvas = document.querySelector(''canvas'');\nconst ctx = canvas.getContext(''2d'');\nctx.fillStyle = ''#10b981'';\nctx.fillRect(10, 10, 100, 80);\nctx.font = ''16px sans-serif'';\nctx.fillText(''Hello Canvas'', 10, 120);</code></pre>', 'lesson', 15, 36, 20),

(@kurs_id, 'Web Workers', '<h2>Web Workers</h2><p>Web Workers běží v odděleném vlákně a neblokují UI. Komunikují přes postMessage.</p><pre><code>const worker = new Worker(''worker.js'');\nworker.postMessage({ data: [1, 2, 3] });\nworker.onmessage = (e) => {\n  console.log(''Result:'', e.data);\n};\n\n// worker.js\nself.onmessage = (e) => {\n  const result = e.data.data.reduce((a, b) => a + b, 0);\n  self.postMessage(result);\n};</code></pre>', 'lesson', 15, 37, 18),

(@kurs_id, 'Clipboard API', '<h2>Clipboard API</h2><p>Clipboard API umožňuje číst a zapisovat do schránky uživatele. Vyžaduje uživatelskou akci a permission.</p><pre><code>async function copyText(text) {\n  try {\n    await navigator.clipboard.writeText(text);\n    console.log(''Copied!'');\n  } catch (err) {\n    console.error(''Failed:'', err);\n  }\n}</code></pre>', 'lesson', 15, 38, 15),

(@kurs_id, 'Drag and Drop API', '<h2>Drag and Drop API</h2><p>Nativní drag and drop pomocí událostí dragstart, dragover a drop. Data přenášej přes dataTransfer objekt.</p><pre><code>el.addEventListener(''dragstart'', (e) => {\n  e.dataTransfer.setData(''text/plain'', e.target.id);\n});\n\ndropZone.addEventListener(''dragover'', (e) => e.preventDefault());\ndropZone.addEventListener(''drop'', (e) => {\n  const id = e.dataTransfer.getData(''text'');\n  dropZone.appendChild(document.getElementById(id));\n});</code></pre>', 'lesson', 15, 39, 18),

(@kurs_id, 'WebSockets', '<h2>WebSockets</h2><p>WebSocket poskytuje trvalé obousměrné spojení mezi klientem a serverem. Ideální pro chat, notifikace a real-time data.</p><pre><code>const ws = new WebSocket(''wss://example.com/ws'');\nws.onopen = () => ws.send(''Hello'');\nws.onmessage = (e) => console.log(e.data);\nws.onclose = () => {\n  setTimeout(() => connect(), 3000); // reconnect\n};</code></pre>', 'lesson', 15, 40, 18),

(@kurs_id, 'IndexedDB', '<h2>IndexedDB</h2><p>IndexedDB je klientská databáze pro velké množství strukturovaných dat. Operace jsou asynchronní a transakční.</p><pre><code>const req = indexedDB.open(''myDB'', 1);\nreq.onupgradeneeded = (e) => {\n  const db = e.target.result;\n  db.createObjectStore(''items'', { keyPath: ''id'' });\n};\nreq.onsuccess = (e) => {\n  const db = e.target.result;\n  const tx = db.transaction(''items'', ''readwrite'');\n  tx.objectStore(''items'').add({ id: 1, name: ''Test'' });\n};</code></pre>', 'lesson', 15, 41, 20),

(@kurs_id, 'Web Storage pokročile', '<h2>Web Storage pokročile</h2><p>Lokální a session storage mají limit (~5MB). Storage event umožňuje synchronizaci mezi taby stejného originu.</p><pre><code>window.addEventListener(''storage'', (e) => {\n  console.log(`${e.key} changed from ${e.oldValue} to ${e.newValue}`);\n});\n\n// Check quota\nnavigator.storage.estimate().then(({usage, quota}) => {\n  console.log(`${usage} / ${quota} bytes used`);\n});</code></pre>', 'lesson', 15, 42, 18),

-- Kvíz 3 (sort_order 43)
(@kurs_id, 'Kvíz 3 — Browser APIs', '<h2>Kvíz 3 — Browser APIs</h2><p>Otestuj znalosti Browser APIs: Intersection Observer, Service Workers, Canvas, WebSockets a dalších.</p>', 'quiz', 50, 43, 15),

-- Sekce 4 — Projekty (sort_order 44-61, xp_reward=20)
(@kurs_id, 'Projekt: Todo aplikace', '<h2>Projekt: Todo aplikace</h2><p>Vytvoř todo aplikaci s DOM manipulací, localStorage a filtrováním. Přidej klávesové zkratky pro rychlou práci.</p><pre><code>function addTodo(text) {\n  const li = document.createElement(''li'');\n  li.textContent = text;\n  li.onclick = () => li.classList.toggle(''done'');\n  list.appendChild(li);\n  saveTodos();\n}</code></pre>', 'lesson', 20, 44, 40),

(@kurs_id, 'Projekt: GitHub profil viewer', '<h2>Projekt: GitHub profil viewer</h2><p>Zobraz profil uživatele z GitHub API. Použij Fetch, Promise.all pro paralelní požadavky a ošetři chyby.</p><pre><code>async function loadProfile(username) {\n  const [user, repos] = await Promise.all([\n    fetch(`https://api.github.com/users/${username}`).then(r => r.json()),\n    fetch(`https://api.github.com/users/${username}/repos`).then(r => r.json())\n  ]);\n  render(user, repos);\n}</code></pre>', 'lesson', 20, 45, 40),

(@kurs_id, 'Projekt: Kalkulačka', '<h2>Projekt: Kalkulačka</h2><p>Postav kalkulačku pomocí tříd s private fields. Přidej podporu klávesnice a validaci vstupů.</p><pre><code>class Calculator {\n  #display = ''0'';\n  appendDigit(d) { this.#display += d; }\n  calculate() { return eval(this.#display); }\n  clear() { this.#display = ''0''; }\n}</code></pre>', 'lesson', 20, 46, 35),

(@kurs_id, 'Projekt: Real-time chat', '<h2>Projekt: Real-time chat</h2><p>Vytvoř chat s WebSockets. Zobraz zprávy v reálném čase a implementuj reconnect logiku při výpadku spojení.</p><pre><code>let ws;\nfunction connect() {\n  ws = new WebSocket(SERVER_URL);\n  ws.onmessage = (e) => appendMessage(JSON.parse(e.data));\n  ws.onclose = () => setTimeout(connect, 3000);\n}\nfunction send(text) { ws.send(JSON.stringify({ text })); }</code></pre>', 'lesson', 20, 47, 45),

(@kurs_id, 'Projekt: Drag and Drop kanban', '<h2>Projekt: Drag and Drop kanban</h2><p>Vytvoř kanban tabuli s drag and drop sloupci. Ulož stav do localStorage a přidej animace při přesunu.</p><pre><code>columns.forEach(col => {\n  col.addEventListener(''dragover'', e => e.preventDefault());\n  col.addEventListener(''drop'', e => {\n    const id = e.dataTransfer.getData(''text'');\n    col.appendChild(document.getElementById(id));\n    saveBoard();\n  });\n});</code></pre>', 'lesson', 20, 48, 45),

(@kurs_id, 'Projekt: SPA router', '<h2>Projekt: SPA router</h2><p>Implementuj jednoduchý SPA router s History API, popstate událostí a parametrickými routes.</p><pre><code>function navigate(path) {\n  history.pushState(null, '''', path);\n  renderRoute(path);\n}\nwindow.addEventListener(''popstate'', () => {\n  renderRoute(location.pathname);\n});</code></pre>', 'lesson', 20, 49, 40),

(@kurs_id, 'Projekt: XP progress widget', '<h2>Projekt: XP progress widget</h2><p>Vytvoř widget s kruhovým progress indikátorem pomocí Canvas. Čti data z cookie a animuj změny.</p><pre><code>function drawRing(ctx, pct) {\n  const r = 40;\n  ctx.beginPath();\n  ctx.arc(50, 50, r, -Math.PI/2, -Math.PI/2 + 2*Math.PI*pct);\n  ctx.strokeStyle = ''#10b981'';\n  ctx.lineWidth = 6;\n  ctx.stroke();\n}</code></pre>', 'lesson', 20, 50, 35),

(@kurs_id, 'Projekt: Nekonečný scroll', '<h2>Projekt: Nekonečný scroll</h2><p>Implementuj nekonečný scroll s Intersection Observer. Načti další data Fetchem a zobraz skeleton loading.</p><pre><code>const observer = new IntersectionObserver((entries) => {\n  if (entries[0].isIntersecting) {\n    loadMore().then(appendItems);\n  }\n});\nobserver.observe(document.querySelector(''#sentinel''));</code></pre>', 'lesson', 20, 51, 40),

(@kurs_id, 'Projekt: Kvíz engine', '<h2>Projekt: Kvíz engine</h2><p>Postav kvíz engine s timerem, scoring systémem a výsledkovou obrazovkou. Spravuj stav otázek a odpovědí.</p><pre><code>class QuizEngine {\n  #score = 0;\n  answer(idx, correct) {\n    if (idx === correct) this.#score++;\n  }\n  getScore() { return this.#score; }\n}</code></pre>', 'lesson', 20, 52, 45),

(@kurs_id, 'Projekt: Form builder', '<h2>Projekt: Form builder</h2><p>Vytvoř dynamický form builder — přidávej pole, validuj je a exportuj data jako JSON. Implementuj drag reorder.</p><pre><code>function addField(type) {\n  const field = document.createElement(''input'');\n  field.type = type;\n  field.name = `field_${fields.length}`;\n  form.appendChild(field);\n  fields.push({ type, name: field.name });\n}</code></pre>', 'lesson', 20, 53, 40),

(@kurs_id, 'Projekt: Markdown preview', '<h2>Projekt: Markdown preview</h2><p>Vytvoř live Markdown preview — píšeš v textaree a výstup se aktualizuje v reálném čase. Sanitizuj HTML výstup.</p><pre><code>textarea.addEventListener(''input'', () => {\n  const html = marked.parse(textarea.value);\n  preview.innerHTML = DOMPurify.sanitize(html);\n});</code></pre>', 'lesson', 20, 54, 40),

(@kurs_id, 'Projekt: Stopky a timer', '<h2>Projekt: Stopky a timer</h2><p>Vytvoř stopky a odpočet s přesným měřením pomocí Web Workers. Přidej Notifications API pro upozornění.</p><pre><code>let start = performance.now();\nfunction tick() {\n  const elapsed = performance.now() - start;\n  display.textContent = formatTime(elapsed);\n  requestAnimationFrame(tick);\n}</code></pre>', 'lesson', 20, 55, 35),

(@kurs_id, 'Design patterns', '<h2>Design patterns v JS</h2><p>Nejčastější vzory: Observer (eventy), Singleton (sdílená instance), Factory (tvorba objektů) a Command (zapouzdření akcí).</p><pre><code>// Observer\nclass EventBus {\n  #listeners = {};\n  on(event, fn) { (this.#listeners[event] ??= []).push(fn); }\n  emit(event, data) { this.#listeners[event]?.forEach(fn => fn(data)); }\n}</code></pre>', 'lesson', 20, 56, 18),

(@kurs_id, 'Bezpečnost', '<h2>Bezpečnost v JS</h2><p>Chraň aplikaci před XSS (sanitizace, CSP), CSRF (tokeny), a CORS útoky. Nikdy nevkládej uživatelský vstup přímo do DOM.</p><pre><code>// XSS prevence\nconst safe = document.createElement(''div'');\nsafe.textContent = userInput; // ne innerHTML!\n\n// CSP hlavička\n// Content-Security-Policy: default-src ''self''</code></pre>', 'lesson', 20, 57, 18),

(@kurs_id, 'Performance', '<h2>Performance optimalizace</h2><p>Debounce a throttle omezí četnost volání. Virtual scroll šetří DOM. requestAnimationFrame zajistí plynulé animace.</p><pre><code>function debounce(fn, ms) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), ms);\n  };\n}\nwindow.addEventListener(''resize'', debounce(onResize, 200));</code></pre>', 'lesson', 20, 58, 18),

(@kurs_id, 'Web Components', '<h2>Web Components</h2><p>Web Components umožňují vytvářet znovupoužitelné HTML elementy s customElements, Shadow DOM a HTML templates.</p><pre><code>class MyCard extends HTMLElement {\n  constructor() {\n    super();\n    this.attachShadow({ mode: ''open'' });\n    this.shadowRoot.innerHTML = `<slot></slot>`;\n  }\n}\ncustomElements.define(''my-card'', MyCard);</code></pre>', 'lesson', 20, 59, 18),

(@kurs_id, 'Intl API', '<h2>Intl API</h2><p>Intl API poskytuje lokalizaci — formátování data, čísel, relativního času a třídění pro různé jazyky.</p><pre><code>new Intl.DateTimeFormat(''cs-CZ'', {\n  dateStyle: ''long''\n}).format(new Date());\n\nnew Intl.NumberFormat(''cs-CZ'', {\n  style: ''currency'', currency: ''CZK''\n}).format(1234.5);</code></pre>', 'lesson', 20, 60, 15),

(@kurs_id, 'JavaScript roadmapa', '<h2>JavaScript roadmapa</h2><p>Kam dál? React/Vue/Svelte pro UI, Node.js pro backend, TypeScript pro typy. Vyber si specializaci a stavuj projekty.</p><pre><code>// Další kroky:\n// - React / Vue / Svelte\n// - Node.js + Express\n// - TypeScript\n// - Testování — Jest, Playwright\n// - CI/CD a nasazení</code></pre>', 'lesson', 20, 61, 15),

-- Kvíz 4 (sort_order 62)
(@kurs_id, 'Kvíz 4 — Projekty a pokročilé vzory', '<h2>Kvíz 4</h2><p>Otestuj znalosti z projektů, design patterns, bezpečnosti a performance optimalizací.</p>', 'quiz', 50, 62, 15),

-- Závěrečný kvíz (sort_order 63)
(@kurs_id, 'Závěrečný kvíz — Celý JavaScript kurz', '<h2>Závěrečný kvíz</h2><p>Obsáhlý kvíz pokrývající celý JavaScript kurz — od základů po pokročilé projekty a vzory.</p>', 'final_quiz', 200, 63, 25);

-- Update lesson count
UPDATE courses SET lesson_count = (SELECT COUNT(*) FROM lessons WHERE course_id = @kurs_id) WHERE id = @kurs_id;