# Serverový login gate

## Cíl

Návštěvník adresy `https://account.vevit.cz/`, který nemá platnou relaci,
je přesměrován na `https://account.vevit.cz/login` dřív, než se načte stránka
účtu.

## Směrování

- Apache interně směruje `/` i `/index.html` na `index.php`.
- Apache interně směruje čistou adresu `/login` na `login.html`.
- `index.php` načte serverovou konfiguraci a ověří cookie `__vvsession` přes
  stávající databázovou relaci.
- Bez platné relace odpoví HTTP 302 s `Location: /login` a ukončí zpracování.
- S platnou relací předá beze změny obsah stávajícího `index.html`.

## Bezpečnost a chyby

- Rozhodnutí o přístupu se děje na serveru; JavaScript není autorizační vrstva.
- `index.php` nevrací heslo ani údaje o relaci a nezpracovává přihlašovací
  formulář.
- Chyba konfigurace nebo databázové obnovy relace zůstane serverovou chybou;
  nesmí se zaměnit za běžné přihlášení.

## Testování

- Test statických pravidel ověří `DirectoryIndex index.php`, ochranu `/` a
  `/index.html` a interní cestu `/login`.
- Test PHP gate ověří 302 na `/login` bez cookie a načtení stránky s platnou
  relací přes testovací adaptér.
