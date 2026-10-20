# Vlastní platební brána, pokladna VeVit Store a Premium: návrh

- **Datum:** 2026-10-20
- **Stav:** odsouhlaseno v konverzaci s provozovatelem (OSVČ, plátce DPH)
- **Prototypy:** `docs/superpowers/specs/2026-10-20-prototypy/`
  (`brana-karta-v4.html`, `pokladna-flow-v4.html`, `udaje-firma.html`), slouží
  jako vizuální předloha, ne jako kód k převzetí.

## 1. Záměr

VeVit dnes posílá zákazníky Store i Premium na hostovanou stránku Stripe
Checkout. Provozovatel chce **vlastní, značkovou platební bránu**, která
působí jako součást VeVit. Jejím středem je animovaná platební karta, která
živě ukazuje, co zákazník vyplňuje, sama pozná značku i českou banku a chyby
ukáže hned. Zároveň se pokladna Store mění z jedné jednoduché stránky na
postup v krocích s Zásilkovnou, nákupem na firmu a českými způsoby platby.
Zákazníci jsou především Češi (a Slováci).

Úspěch znamená:

- zákazník zaplatí kartou, Apple Pay, Google Pay, PayPalem, bankovním
  tlačítkem nebo paysafecard, aniž by opustil vzhled VeVit (kromě nutných
  přesměrování PayPal, GoPay a 3D Secure);
- karta reaguje plynule a chyby jsou srozumitelné česky;
- objednávka i Premium mají správnou fakturu (daňový doklad) z Fakturoidu.

## 2. Cíle, ne-cíle, anti-cíle

**Cíle**

1. Vlastní platební formulář karty (vlastní `<input>` pole) s animovanou kartou:
   zvýraznění právě vyplňovaného pole, otočení na zadní stranu při CVC,
   zčervenání chybného pole i odpovídající zóny na kartě, Luhn, rozpoznání
   značky (Visa, Mastercard, Maestro, Amex) a české/slovenské banky podle BIN,
   loga značek a bank. Styl **A**: karta se přebarví do barev rozpoznané banky
   (neznámá banka = neutrální grafitová).
2. Stejná brána pro **Store i Premium** (sdílená komponenta).
3. Platební metody: karta (Stripe), Apple Pay, Google Pay, PayPal (Stripe),
   bankovní tlačítka a paysafecard (GoPay).
4. Pokladna Store **v krocích**: 1 Košík → 2 Doprava a platba → 3 Údaje →
   4 Platba → 5 Hotovo.
5. Doprava: Zásilkovna (výdejní místo i Z-BOX, CZ + SK, oficiální mapa) a
   doručení na adresu (dopravce zatím neurčen). Jen digitální košík krok
   Doprava přeskočí.
6. Nákup na firmu: IČO s kontrolou kontrolní číslice, doplnění názvu, DIČ a
   sídla z ARES, volitelná jiná fakturační adresa.
7. Premium (Bronze/Silver/Gold, měsíčně/ročně) placené přes vlastní bránu
   jako předplatné Stripe Billing, bez Managed Payments.
8. Faktury a opravné doklady přes Fakturoid včetně OSS.

**Ne-cíle**

- paysafecard ani bankovní tlačítka pro Premium (nejdou strhávat opakovaně).
- Dobírka, platba převodem s QR, Twisto/Skip Pay (GoPay je umí, ale nebyly
  požadovány).
- Výběr dopravce pro doručení na adresu (provozovatel doplní později;
  zásilky na adresu se zatím vyřizují ručně jako dnes).
- Jiná měna než CZK.
- Migrace stávajících předplatitelů (žádní platící neexistují).

**Anti-cíle** (i kdyby to „fungovalo“, je to selhání)

- Číslo karty, CVC nebo celé PAN se dostane na server VeVit, do logů, do
  analytiky, do databáze nebo do chybových hlášení.
- Cena, doprava nebo částka k zaplacení se počítá na klientovi a server jí
  věří. Server vždy přepočítá vše sám (dnešní model snapshotu zůstává).
- Karta tvrdí špatnou banku. Neznámá banka se zobrazí jako „banka
  nerozpoznána“, nikdy se nehádá.
- Brána, která jde zneužít k testování kradených karet (card testing).
- Objednávka označená jako zaplacená jen podle návratu z přesměrování (bez
  ověření webhookem či dotazem na poskytovatele).

## 3. Omezení

- **PCI DSS:** vlastní pole pro kartu = přímá práce s čísly karet. Stripe
  vyžaduje zapnutí „raw card data APIs“ přes support: v **testovacím režimu
  bez dokladů**, v **ostrém režimu** s vyplněným **SAQ D** (ročně). Ostrý
  provoz karet je proto podmíněn compliance; Apple Pay, Google Pay, PayPal a
  GoPay lze spustit dřív.
  Zdroj: <https://support.stripe.com/questions/enabling-access-to-raw-card-data-apis>
- **Stripe Managed Payments** podporují jen hostovaný Checkout a Payment
  Links, ne vlastní formuláře. Premium proto Managed Payments ztrácí a
  **VeVit je prodejce (merchant of record)**: DPH, faktury, spory o platby.
  Zdroj: <https://docs.stripe.com/managed-payments>
- **DPH:** provozovatel je OSVČ, plátce DPH. Premium = digitální služba;
  spotřebitelům v jiných státech EU se účtuje DPH jejich státu (OSS).
  Fyzické zboží do EU spadá pod OSS po překročení 10 000 € ročně.
- **Next.js 16** s odlišnými konvencemi: před psaním kódu číst
  `node_modules/next/dist/docs/` (viz `AGENTS.md`).
- **Stávající bezpečnostní model Store zůstává:** checkout snapshot s hashem a
  idempotencí (`src/lib/store-checkout-service.ts`), CAS přechody stavů,
  guest grant cookies, same-origin kontrola, webhook ledger
  (`store_payment_events`), stavový automat plateb
  (`src/lib/store-payment-service.ts`).
- **CSP** je dnes jen `Report-Only` (`next.config.ts`) a musí povolit
  Stripe.js, GoPay a Zásilkovnu.
- Repo už jednou řešilo únik tajemství (`docs/STRIPE-WEBHOOK-INCIDENT.md`):
  žádné klíče v kódu, `npm run secret-scan` musí projít.

## 4. Co rozhodl provozovatel

| Téma | Rozhodnutí |
|---|---|
| Pole pro kartu | Vlastní pole (ne Stripe Elements), skutečné číslice na kartě, PCI SAQ D akceptováno |
| Premium | Také přes vlastní bránu, bez Managed Payments |
| Styl karty | A: barvy rozpoznané banky + logo banky a značky |
| Loga | Loga značek karet, bank, Zásilkovny a platebních metod všude, kde se metoda volí |
| Platební metody | Karta, Apple Pay, Google Pay, PayPal (Stripe) + bankovní tlačítka a paysafecard (GoPay) |
| Pokladna | Rozložení A, v krocích |
| Doprava | Zásilkovna (výdejní místo, Z-BOX) + doručení na adresu, dopravce později |
| Firmy | Ano: IČO, DIČ, ARES |
| Faktury | Fakturoid (provozovatel účet zakládá) |
| Patička faktury | „Fyzická osoba zapsaná v živnostenském rejstříku.“ + web, e-mail, odkaz na reklamace |
| Stávající předplatitelé | Žádní platící, migrace není potřeba |

## 5. Návrh řešení

### 5.1 Přehled toků

```
Store:  košík (localStorage) → /store/checkout/doprava → /store/checkout/udaje
        → [server: checkout snapshot + objednávka] → /store/checkout/platba
        → (karta | wallet | PayPal | GoPay) → webhook/notifikace potvrdí
        → /store/success → Zásilkovna zásilka + Fakturoid faktura

Premium: /account/billing → výběr tarifu → stránka platby Premium
        → (karta | wallet | PayPal) → Stripe subscription aktivní
        → stripe-webhook aktivuje tier → Fakturoid faktura (i u každé obnovy)
```

### 5.2 Karta (Stripe, vlastní pole)

**UI** (sdílená komponenta, např. `src/components/payments/card-gateway/`):

- Pole: číslo karty, jméno na kartě, platnost (MM/RR), CVC. Atributy
  `autocomplete="cc-number|cc-name|cc-exp|cc-csc"` a `inputmode="numeric"`,
  aby fungovalo automatické vyplnění prohlížečem.
- Animovaná karta podle prototypu `brana-karta-v4.html`: číslice se objevují
  s animací, prázdná místa jako `•`, seskupení 4-4-4-4 (Amex 4-6-5), otočení
  při fokusu CVC, aktivní zóna zvýrazněná, chybná zóna červená s krátkým
  zatřesením. CVC se na kartě zobrazuje jen jako tečky.
- Respektovat `prefers-reduced-motion` (bez otáčení a třesení, jen změna
  stavů).
- Validace (čistý modul bez závislostí, testovaný): značka podle prefixu,
  povolené délky podle značky, **Luhn** po dosažení plné délky, platnost
  (měsíc 01–12, ne v minulosti, max. +20 let), délka CVC podle značky (Amex 4).
  Chybové texty česky (prototyp je předlohou).
- Řada přijímaných značek nad formulářem: rozpoznaná se rozsvítí.

**Rozpoznání banky (BIN):**

1. Okamžitě z lokální tabulky prefixů (6 číslic) → banka, barvy, logo.
   Výchozí data jsou v prototypu (ČS, ČSOB, KB, Raiffeisenbank vč. bývalé Equa,
   UniCredit vč. 542812, MONETA, Air Bank). Veřejné zdroje jsou neúplné a
   místy si odporují: prefix, který je ve zdrojích u dvou bank (např. 418809),
   do tabulky nepatří.
2. Když tabulka prefix nezná: klient pošle **jen prvních 6–8 číslic** na
   serverový endpoint, ten se zeptá externí BIN služby a výsledek uloží do
   tabulky mezipaměti (každý prefix se dotazuje jen jednou). Banka pak
   „naskočí“ se zpožděním. Odpověď se mapuje na známé banky (logo, barvy);
   jinak se zobrazí jen název z BIN služby bez barev.
3. Endpoint je rate-limitovaný, nikdy nepřijme víc než 8 číslic a nic neloguje.

Loga bank: SVG z tiskových materiálů bank (nebo podobně oficiálních zdrojů)
v `public/`, použití jen k identifikaci karty. Loga značek z oficiálních
brand balíčků Visa/Mastercard. Prototyp používá favicony a zjednodušené
kresby, ty se do produkce nepřebírají.

**Tokenizace a platba:**

- Prohlížeč pošle údaje karty **přímo na Stripe API** (`POST
  https://api.stripe.com/v1/payment_methods` s publishable key, typ `card`).
  Server VeVit dostane jen `pm_…`. (Vyžaduje zapnuté raw card data API, viz
  kap. 3.)
- Server vytvoří/potvrdí PaymentIntent pro objednávku (částka z objednávky,
  nikdy z klienta), s idempotency klíčem odvozeným z objednávky a pokusu.
- 3D Secure: když PaymentIntent vrátí `requires_action`, klient zavolá
  `stripe.handleNextAction({ clientSecret })` ze Stripe.js (funguje bez
  Elements). Pak se stav ověří na serveru.
- Výsledek: přechod na `/store/success` až po potvrzení serverem; finální
  „zaplaceno“ zapisuje webhook (`payment_intent.succeeded`), stejně jako
  dnes `checkout.session.completed`.

**Ochrana proti zneužití:** Cloudflare Turnstile (už v projektu,
`src/lib/turnstile.ts`) před prvním pokusem o platbu, rate limit pokusů na
objednávku/IP/session, zapnutý Stripe Radar, limit počtu neúspěšných pokusů na
objednávku. Na platební stránce žádné skripty třetích stran kromě Stripe.js,
GoPay a Zásilkovny; analytika se na stránce s polem karty nespouští.

### 5.3 Apple Pay, Google Pay, PayPal (Stripe)

- Apple Pay a Google Pay přes Stripe **Express Checkout Element**. Tlačítko
  se ukáže jen na podporovaném zařízení; v kroku 2 se metoda nabízí jen
  tehdy, když ji zařízení umí (jinak je skrytá nebo neaktivní s vysvětlením).
  Apple Pay vyžaduje ověření domény ve Stripe.
- PayPal přes Stripe (CZ firmy, CZK podporováno): `confirmPayPalPayment` s
  přesměrováním na PayPal a návratem na VeVit; stav potvrdí webhook.
- Zdroj: <https://docs.stripe.com/payments/paypal>

### 5.4 GoPay (bankovní tlačítka, paysafecard)

- Jen pro Store, jednorázové platby. Metody `BANK_ACCOUNT` (se seznamem
  českých a slovenských bank, výchozí banku lze předvybrat přes SWIFT) a
  `PAYSAFECARD`.
- Server vytvoří platbu přes GoPay REST API (OAuth2), přesměruje na bránu GoPay
  (redirect nebo inline podle toho, co projde CSP a vypadá lépe), návrat na
  VeVit. Stav se **vždy ověří dotazem na GoPay** po notifikaci
  (`notification_url`) i po návratu; notifikace sama nic nedokazuje.
- Ledger notifikací a idempotence obdobně jako `store_payment_events`.
- Sandbox GoPay pro vývoj. Zdroje: <https://doc.gopay.com/>,
  <https://github.com/gopaycommunity/gopay-php-api>.

### 5.5 Pokladna Store v krocích

Předloha: `pokladna-flow-v4.html` a `udaje-firma.html`.

- **Ukazatel kroků** nahoře, souhrn objednávky vpravo (na mobilu pod obsahem)
  s ukazatelem „ještě X Kč do dopravy zdarma“.
- **Krok 2 Doprava a platba:** volba dopravy (s logy, cenou, přeškrtnutou
  cenou při dopravě zdarma) a volba platby (karta s logy značek, Apple Pay,
  Google Pay, PayPal, bankovní tlačítko, paysafecard). Ikony v pevně širokém
  sloupci, aby texty začínaly pod sebou.
- **Krok 3 Údaje:** jméno, e-mail, telefon s předvolbou +420/+421 (Zásilkovna
  posílá SMS), shrnutí zvolené dopravy s odkazem „Změnit“, doručovací adresa
  (jen u doručení na adresu), přepínač „Nakupuji na firmu“, přepínač „Jiná
  fakturační adresa“, poznámka, povinný souhlas s obchodními podmínkami.
  Obsahuje-li košík digitální produkt, také **povinný souhlas se zahájením
  plnění před uplynutím lhůty pro odstoupení** (dnešní text stránky „Vrácení a
  reklamace“ na to odkazuje). Přihlášenému zákazníkovi se údaje předvyplní.
- **Krok 4 Platba:** podle zvolené metody karta (5.2), tlačítko walletu
  (5.3), přesměrování PayPal nebo GoPay.
- **Krok 5 Hotovo:** stávající `/store/success`, doplněný o způsob dopravy a
  platby.
- Rozpracovaná pokladna (volby z kroků 2–3) se drží na klientovi
  (`sessionStorage`), aby šlo listovat zpět. Checkout snapshot se vytváří až
  při přechodu na krok 4 a obsahuje všechny nové údaje. Zpět z kroku 4 na
  změnu údajů = nový snapshot.
- Nákup jako host funguje dál (stávající guest grants).

### 5.6 Doprava

| Metoda | Cena | Poznámka |
|---|---|---|
| Zásilkovna: výdejní místo / Z-BOX (CZ, SK) | 69 Kč | mapa = oficiální widget Zásilkovny v6 |
| Doručení na adresu (CZ, SK) | 99 Kč | dopravce neurčen, vyřízení ručně |
| Jen digitální košík | 0 Kč | krok Doprava se přeskočí |

- Doprava zdarma od 1 000 Kč a pro Silver+ (stávající `userHasFreeShipping`)
  platí pro obě metody. Ceny a hranice jsou serverová konfigurace na jednom
  místě a klient je jen zobrazuje (dnes je pravidlo duplikované v
  `src/lib/cart.ts` a `store-checkout-service.ts`; sjednotit).
- Server ověří, že vybrané výdejní místo existuje a odpovídá zemi.
- **Po zaplacení se zásilka sama založí v Zásilkovně** (API, `createPacket`),
  číslo zásilky a sledovací odkaz se uloží do `store_deliveries` (carrier
  `packeta`). Selhání založení nezablokuje objednávku: objednávka zůstane
  zaplacená, zásilka se zkusí znovu a v adminu je vidět chyba.
- Hmotnost zásilky: produkty potřebují hmotnost (nový sloupec s rozumnou
  výchozí hodnotou).

### 5.7 Nákup na firmu

- IČO: 8 číslic, kontrolní číslice (vážený součet mod 11), chybné IČO
  zčervená s textem stejně jako chybná karta.
- Platné IČO → dotaz do **ARES** (`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}`)
  **přes server VeVit** s krátkou mezipamětí; doplní obchodní jméno, DIČ, sídlo.
  Neexistující IČO = chyba; nedostupný ARES = ruční vyplnění. Firma bez DIČ =
  upozornění „není plátce DPH“.
- Firemní údaje jdou do snapshotu, objednávky a na fakturu.
- Totéž (volitelně) u Premia, včetně EU DIČ kvůli reverse charge.

### 5.8 Premium přes bránu

- Vlastní stránka platby Premium (účet je vícejazyčný: nové texty do
  `src/lib/account-i18n.ts`). Platební metody: karta, Apple Pay, Google Pay,
  PayPal.
- Stripe Billing: zákazník (`ensureStripeCustomer` existuje), subscription s
  cenou z `premium_price_catalog`, výchozí platební metodou, první platba přes
  PaymentIntent/confirmation secret první faktury (přesný tvar podle Stripe
  API verze pinnuté SDK `stripe@22`, ověřit v dokumentaci), 3D Secure stejně
  jako u Store. `managed_payments` se už neposílá.
- **Stripe Tax** s `automatic_tax` pro OSS: ceny v katalogu jako **včetně
  DPH** (`tax_behavior: inclusive`); od zákazníka se sbírá země. Pokud
  stávající Stripe ceny nejsou inclusive, vytvoří se nové a katalog se
  přepne. Hrubá cena je pro všechny země stejná.
- Aktivace tarifu zůstává v edge funkci `supabase/functions/stripe-webhook`,
  která se rozšíří o události nového toku (vytvoření předplatného, zaplacená
  a nezaplacená faktura). Kontrola ceny proti katalogu zůstává.
- Neúspěšná obnova: Stripe opakované pokusy, uživatel dostane upozornění a v
  účtu možnost **změnit kartu** přes stejnou bránu (SetupIntent). Zrušení a
  změna tarifu dál přes Stripe customer portal (`billing/portal.php`).
- PayPal pro předplatné může vyžadovat schválení ve Stripe; do schválení se
  PayPal u Premia nenabízí.

### 5.9 Fakturoid

- API v3, OAuth client credentials. Proměnné prostředí
  `FAKTUROID_CLIENT_ID`, `FAKTUROID_CLIENT_SECRET`, `FAKTUROID_ACCOUNT_SLUG`
  (prázdné v `.env.example`, hodnoty zadá provozovatel mimo repo).
- Po potvrzení platby (Store objednávka, každá zaplacená faktura předplatného):
  kontakt (subject) → faktura v samostatné číselné řadě → označit jako
  zaplacenou → odeslat zákazníkovi e-mailem. Idempotence: ID faktury
  Fakturoidu uložené u objednávky / platby předplatného; opakování nevytvoří
  druhou fakturu.
- Položky se sazbou DPH: produkty potřebují sazbu DPH (nový sloupec, výchozí
  21 %; skutečné sazby nastaví provozovatel), doprava podle hlavní sazby.
- OSS: Premium spotřebiteli v jiném státě EU → režim `oss: "service"`
  a sazba státu zákazníka (z Stripe Tax). Store zboží zatím `disabled`.
- Vratka / refundace → **opravný daňový doklad** (`document_type:
  "correction"`) navázaný na původní fakturu.
- Faktura se negeneruje synchronně v webhooku, pokud by mohla zdržet odpověď
  Stripe: zpracování s opakováním (fronta nebo plánovaná úloha) a viditelnou
  chybou.
- Zdroj: <https://www.fakturoid.cz/api/v3/invoices>

### 5.10 Datový model (orientačně, přesný tvar je na staviteli)

- `store_orders`: poskytovatel platby (`stripe` | `gopay`), metoda platby,
  `stripe_payment_intent` (existuje), ID platby GoPay, metoda dopravy, výdejní
  místo Zásilkovny (ID, název, adresa, země), telefon, firemní údaje (IČO, DIČ,
  název, fakturační adresa), souhlasy (čas), ID faktury Fakturoidu.
- `store_products`: hmotnost, sazba DPH.
- Tabulka mezipaměti BIN (prefix → banka, značka, typ, země, zdroj, čas).
- Ledger GoPay notifikací.
- Premium: vazba plateb předplatného na faktury Fakturoidu.
- Migrace v konvenci `supabase/sql/store/migrations/*_up.sql` / `_down.sql`
  a `supabase/sql/account/` podle tabulky, s README postupem.

### 5.11 Webhooky a notifikace

- Store webhook (`src/app/store/api/webhook.php/route.ts`): přidat
  `payment_intent.succeeded` / `payment_intent.payment_failed` pro nový tok,
  stávající `checkout.session.completed` ponechat pro rozpracované staré
  objednávky. Stejné záruky: ověření podpisu, ledger, CAS, kontrola částky a
  měny proti objednávce.
- Stripe destination dnes přijímá jen 4 typy událostí (viz incident
  dokument): rozšířit seznam vědomě a zdokumentovat.
- GoPay notifikační endpoint: idempotentní, stav vždy z API GoPay.

### 5.12 Obsah a právní texty

Texty v `src/app/store/[page]/page.tsx` dnes tvrdí, že platby probíhají
„výhradně přes Stripe“ a „žádné platební údaje neprocházejí naším serverem“.
Upravit podle nové reality (Stripe + GoPay, údaje karty jdou přímo do Stripe,
VeVit je neukládá) a doplnit Zásilkovnu, ceny dopravy, nákup na firmu.

## 6. Na staviteli (rozhodne sám, v duchu tohoto návrhu)

- Přesné URL kroků pokladny a stránky platby Premium.
- Konkrétní BIN služba (např. Mastercard BIN Lookup API nebo placená
  agregovaná služba) a tvar tabulky mezipaměti.
- Redirect vs. inline brána GoPay.
- Fronta / plánovaná úloha pro Fakturoid a Zásilkovnu (Vercel Cron, Supabase
  pg_cron nebo jiné řešení dostupné v projektu).
- Struktura komponent, CSS (navázat na `store-*` třídy v
  `src/app/globals.css`), testovací strategie čistých modulů.

## 7. Rozhodnutí, která udělal návrh (provozovatel je může změnit)

1. Ceny dopravy 69 Kč (Zásilkovna) a 99 Kč (adresa); zdarma od 1 000 Kč a
   pro Silver+ u obou.
2. BIN ve dvou vrstvách: lokální tabulka + externí služba s mezipamětí.
3. Automatické zakládání zásilek v Zásilkovně po zaplacení.
4. Pořadí fází (kap. 8), GoPay jako samostatná fáze po pokladně.
5. Hrubá cena Premia stejná pro všechny země EU (OSS se počítá uvnitř ceny).
6. Firemní nákup i u Premia.
7. Rozpracovaná pokladna v `sessionStorage`, snapshot až před platbou.
8. Turnstile + rate limit jako ochrana proti card testingu.
9. Starý tok Stripe Checkout zůstane v kódu jen pro dokončení rozpracovaných
   objednávek, nové objednávky ho nepoužívají.

## 8. Fáze

1. **Platební brána (Stripe, test mode):** karta s animací, validace, BIN,
   tokenizace, 3D Secure, Apple Pay, Google Pay, PayPal; napojeno na stávající
   objednávky Store (stávající jednostránková pokladna dočasně jen přesměruje
   na novou bránu místo Stripe Checkout).
2. **Pokladna v krocích:** kroky 1–5, Zásilkovna (widget + automatické
   zásilky), doručení na adresu, firma + ARES, souhlasy, sjednocení cen dopravy.
3. **GoPay:** bankovní tlačítka a paysafecard ve Store.
4. **Premium přes bránu:** subscription, Stripe Tax, změna karty, webhooky.
5. **Fakturoid:** faktury Store i Premium, opravné doklady, OSS.

Každá fáze je samostatně nasaditelná a nerozbije předchozí.

## 9. Před ostrým spuštěním (úkoly provozovatele, ne kódu)

- [ ] Stripe support: zapnout raw card data API pro **test mode**
      (bez dokladů); pro **live** dodat SAQ D a popis systému.
- [ ] Stripe: ověřit doménu pro Apple Pay, aktivovat PayPal (a požádat o
      opakované platby PayPal pro Premium), zapnout Stripe Tax a registraci OSS.
- [ ] GoPay: obchodní smlouva, sandbox a ostré přístupy.
- [ ] Zásilkovna: účet, API klíč a API heslo.
- [ ] Fakturoid: účet, číselná řada pro e-shop a Premium, patička (kap. 4),
      **nově vygenerovaný** API secret (původní byl prozrazen v chatu).
- [ ] BIN služba: účet a klíč.
- [ ] Sazby DPH a hmotnosti produktů.
- [ ] Logo banky / značek: oficiální SVG.
- [ ] Přepnout CSP z `Report-Only` na vynucenou aspoň pro platební stránky.
