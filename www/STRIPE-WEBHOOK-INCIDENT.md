# Stripe webhook — uzavření incidentu 2026-08-05

Dokument neobsahuje žádné klíče ani signing secrets.

## Dopad a kontrola historie

- Exponovaný signing secret byl platný, ale původní Stripe destination byla
  chybně směrována na kořen Store a před incidentním testem neměla žádná
  doručení.
- Stripe delivery log proto za dobu expozice neobsahuje neznámý požadavek ani
  událost, kterou by endpoint zpracoval. První delivery záznamy pocházejí z
  řízeného testu 5. 8. 2026.

## Náprava

- Destination nyní míří přímo na Supabase Edge Function a přijímá jen
  `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted` a `invoice.payment_succeeded`.
- Signing secret byl rollnut s 24hodinovým překryvem; nový je uložen pouze v
  Supabase Edge secrets. Starý vyprší automaticky 6. 8. 2026.
- Stripe API přístup webhooku používá samostatný read-only restricted key.
- Standardní testovací API key, který se objevil v lokálním browser artefaktu,
  byl rovněž preventivně rotován; navazující `stripe-worker` odpověděl 200.

## Ověření aplikační logiky

- Platný reálný Stripe event: `200 Delivered / Recovered` na aktuální verzi
  funkce.
- Neplatný podpis: HTTP 400.
- `event.id` je atomicky evidováno v `stripe_webhook_events`; duplicitní event
  neprovede změnu podruhé.
- Webhook znovu načítá kanonický objekt ze Stripe a nespoléhá na částku ani
  metadata z doručeného JSON. Price, měna a částka se porovnávají s
  `premium_price_catalog` a vlastní objednávkou/subscription.
