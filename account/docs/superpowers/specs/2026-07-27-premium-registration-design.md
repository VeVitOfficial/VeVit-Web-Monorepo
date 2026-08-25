# Prémiový registrační formulář

## Cíl

Nahradit současnou jednoduchou registraci plně přístupným formulářem s okamžitou validací, bezpečnými pravidly hesla a kontrolou dostupnosti přezdívky.

## Rozhraní

- Formulář zůstává v tmavém vizuálním stylu a používá jednu kartu s jemným stínem, přechody a animacemi v délce 200–300 ms.
- Jméno a příjmení a Přezdívka jsou na obrazovkách od 640 px vedle sebe; pod touto šířkou se řadí pod sebe.
- Všechna povinná pole mají hvězdičku, viditelný label, popis chyby propojený přes `aria-describedby` a stav přes `aria-invalid`.
- Heslo i Potvrzení hesla obsahují tlačítko s ikonou oka. Jde ovládat klávesnicí a ovládací prvek oznamuje viditelnost přes `aria-pressed`.
- Pod heslem se průběžně ukazuje seznam pěti pravidel; splněné pravidlo získá zelenou fajfku.
- Po přechodu pole z neplatného do platného stavu se jednou zahraje zelený obrys a zobrazí se fajfka. Neplatné rozpracované pole má červený obrys a stručnou chybu; po opravě ihned zmizí.
- Tlačítko Registrace je vypnuté, dokud jsou všechna pole platná a je potvrzená dostupnost přezdívky. Během odesílání se vypne celý formulář a tlačítko zobrazí loading stav.
- Po úspěchu se zobrazí zelená animovaná fajfka a text „Účet byl úspěšně vytvořen.“; po 1,2 s uživatel přejde na `/`, kde jej platná serverová relace pustí do účtu.

## Pravidla validace

- Jméno a příjmení: po oříznutí alespoň 2 znaky.
- Přezdívka: 3–30 znaků; pouze písmena, čísla, podtržítko a tečka. Po 350 ms bez dalšího psaní klient zavolá endpoint dostupnosti. Při obsazené hodnotě zobrazí „Tato přezdívka je již obsazená.“
- E-mail: standardní formát e-mailu.
- Heslo: nejméně 8 znaků, jedno velké písmeno, jedno malé písmeno, jedno číslo a jeden speciální znak.
- Potvrzení hesla: přesně stejné znaky jako heslo.
- Server vynucuje stejná pravidla hesla a přezdívky; klientská kontrola je pouze UX. Server navíc odmítne heslo delší než 72 bajtů kvůli limitu bcrypt.

## API

- Nový `GET api/nickname-availability.php?nickname=...` vrací `{"available":true}` nebo `{"available":false}`.
- Endpoint validuje syntax přezdívky, má stejná CORS pravidla a nevrací žádné údaje o existujícím uživateli.
- `api/register.php` používá stejná pravidla přezdívky a hesla. Jedinečný databázový constraint zůstává zdrojem pravdy proti souběžným registracím.

## Testování

- PHP testy pokryjí pravidla registrace, kontrolu dostupnosti a ochranu serverové validace.
- Statický test registrace ověří potřebná pole, ARIA vazby, dostupnost přezdívky, blokování tlačítka a úspěšný stav.
- Interaktivní ruční kontrola ověří rozložení na desktopu i mobilu, stav oka, animace, Enter a plné vypnutí formuláře při requestu.
