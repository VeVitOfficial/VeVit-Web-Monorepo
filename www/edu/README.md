# VeVit Edu – statická verze

Statická (čistá HTML/CSS/JS) verze výukové platformy VeVit Edu. Běží bez jakéhokoliv
build kroku nebo běhového frameworku – stačí nahrát soubory na webhosting (např. Wedos).

## Struktura

```
index.html        # vstupní stránka + načítání CDN (Tailwind Play, KaTeX, Lucide, Geist)
.htaccess         # SPA fallback (Apache/Wedos) – libovolná cesta → index.html
favicon.ico
css/styles.css    # design tokeny (dark/light), glass, scrollbar, katex, code block
js/               # ES moduly – router, store, komponenty, stránky
  app.js          # entry point (theme/lang/router)
  router.js       # history API router (trailing-slash cesty jako originál)
  i18n.js         # 5 jazyků (cs/en/es/de/uk) + t()
  config.js       # konstanty (342 lekcí, 11950 XP, kategorie)
  lib/            # dom, api (fetch JSON), globals (copyCode)
  store/          # theme, lang, progress (localStorage), custom-lessons
  components/     # navbar, ui (XPBadge/CircularProgress), lesson-content,
                  #   code-block, quiz, exercise (vč. JS sandbox runner), custom-blocks
  pages/          # home, programovani, course, lesson, create, my-lesson
data/courses/     # kurz + lekce data (JSON) – zdroj pravdy pro obsah
content/ai/       # AI gramotnost – lekce (JSON)
```

## Jak to funguje

- `index.html` má `<base href="/">`, takže relativní cesty (`js/app.js`, `css/styles.css`,
  `data/...`) resolvingují vždy vůči kořeni webu i po client-side navigaci.
- Router (history API) přepíná stránky podle URL (`/dashboard/`, `/programovani/`,
  `/kurzy/<slug>/`, `/lekce/<slug>/`, `/lekce/vytvorit/`, `/lekce/moje/detail?slug=…`).
- `.htaccess` zajistí, že přímé deep-linky vrátí `index.html` (SPA fallback).
- Styl: Tailwind přes Play CDN + vlastní design tokeny v `css/styles.css`.
- Pokrok (dokončené lekce/cvičení/kvízy) a vlastní lekce se ukládají do `localStorage`.

## Nasazení na Wedos

1. Nahrajte celý obsah tohoto adresáře do `www/` (kořen domény/subdomény).
2. Hotovo – `.htaccess` zajistí routing.

> Web předpokládá nasazení v kořeni (sub)domény. Při nasazení do podsložky upravte
> `<base href="/">` v `index.html` na `<base href="/vase-slozka/">`.

## Soubory navíc
- `dev-server.php` – lokální dev router (na Wedosu nepotřeba, řeší `.htaccess`).
- `php/ai-proxy.php` – AI proxy (vyžaduje vyplnit API klíč).

## Poznámky

- AI tutor z původní Next.js verze nebyl portován (vyžadoval by backend, který na
  sdíleném Wedos hostingu není k dispozici).
- `legacy/` obsahuje starší statický prototyp (nepoužívá se) – lze smazat.


## Chytrý vyhledávač (Wikipedia + AI)

Hledání se spouští z vyhledávacího pole na dashboardu (Enter):
- **Běžný dotaz** (např. `Karel IV.`) → načte a přestyyluje článek z české Wikipedie
  (tabulky, infoboxy, obrázky, citace, kód v dark theme), interní odkazy se otevírají
  v aplikaci. Obsah článku (TOC) je v levém draweru otevíraném hamburger menu ☰;
  klik scrolls na nadpis. Text je plně šířky.
- **Dotaz končící `?`** (např. `Kdy se narodil Karel IV.?`) → AI režim: najde článek,
  pošle text + otázku do LLM, zobrazí stručnou odpověď, zvýrazní přesnou citaci
  v textu (`<mark class="ai-highlight">`, žluté pozadí/černý text) a auto-scrolluje na ni.
  Pokud AI odpověď nenajde, ukáže upozornění a celý článek.

### AI proxy (klíč server-side, bezpečně)
- `php/ai-proxy.php` – server-side volání LLM (OpenAI-kompatibilní). **Vyplň `$API_KEY`**
  (a případně `$API_URL` / `$MODEL`). Funguje s OpenAI, OpenRouter, Groq i lokálním Ollama.
- Klient volá `POST /php/ai-proxy.php` se `{question, context}` → vrací `{answer_text, exact_quote}`.

### Lokální spuštění (včetně AI proxy + SPA fallback)
```bash
php -S localhost:43210 -t . dev-server.php
```
(`dev-server.php` je jen pro lokální dev; na Wedosu routing řeší `.htaccess`.)
