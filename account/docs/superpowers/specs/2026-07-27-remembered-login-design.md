# Zapamatované přihlášení

## Cíl

Přihlašovací stránka zobrazuje e-mail a heslo v jednom formuláři. Uživatel si
může zvolit trvalé přihlášení pomocí volby „Zapamatovat si mě“.

## Chování

- Formulář obsahuje e-mail, heslo, volbu „Zapamatovat si mě“, odkaz pro obnovu
  hesla a tlačítko „Přihlásit se“.
- Pokud je volba zaškrtnutá, úspěšné přihlášení vytvoří relaci platnou 30 dní.
  Cookie i databázová relace mají shodnou expiraci.
- Při každém úspěšném ověření relace na stránce účtu se její expirace prodlouží
  na dalších 30 dní. Obnoví se serverová relace i cookie.
- Pokud volba zaškrtnutá není, cookie relace nemá trvalou expiraci a skončí při
  zavření prohlížeče. Serverová relace je přesto omezená na 30 dní a během
  aktivního používání se obnovuje.
- Odhlášení odstraní cookie i serverovou relaci bez ohledu na zvolený režim.

## Bezpečnost

- Cookie nikdy neobsahuje heslo, e-mail ani jiné uživatelské údaje; obsahuje
  pouze náhodný token relace.
- Cookie zůstává `Secure`, `HttpOnly`, `SameSite=Lax` a používá cestu `/`.
- Rozhraní předává serveru pouze boolean `remember`; dobu relace určuje server.
- Prodloužení relace se děje až po úspěšném ověření neprošlé relace.

## Testování

- Endpoint přihlášení musí testovat předání volby, 30denní trvalou cookie a
  session cookie bez expirace.
- Ověření aktuálního uživatele musí testovat prodloužení neprošlé relace a
  odmítnutí proslé relace.
- Testy rozhraní ověří, že jediný formulář odesílá e-mail, heslo a volbu při
  Enteru i kliknutí na tlačítko.
