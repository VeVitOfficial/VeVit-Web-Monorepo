# Customer agenda security self-review

Datum: 2026-07-30. Rozsah: lokální implementace a izolovaný PostgreSQL 16
fixture. Produkční Supabase ani produkční storage nebyly kontaktovány.

## Ověřené hrozby

- Cross-order item: kompozitní FK `(order_id, order_item_id)` odmítá cizí item.
- Double allocation: Claims a Returns používají jediný `CaseQuantityAvailability`
  a řádkový zámek; souběhový fork test pustí jen jednu operaci posledního kusu.
- Final consumption: je serverově odvozena, bounded constrainty brání záporné
  a nadlimitní hodnotě, final state se běžně neotevírá.
- Owner kombinace: DB CHECK odmítá account bez user ID i guest s user ID.
- Attachment XOR: bez parenta i dva parenty jsou odmítnuty.
- Attachment public ID: nestačí; download znovu ověří parent order grant/account,
  revokaci, scan stav, canonical path, POST a CSRF. HTTP test ověřuje úspěšný
  autorizovaný download i odmítnutí stejného public ID bez guest grantu.
- Upload filename: executable MIME je odmítnut přes `finfo`; navíc se odmítají
  nebezpečné executable/dvojité přípony typu `evidence.php.jpg`.
- Supabase Data API: RLS je zapnuté, `PUBLIC` i `anon`/`authenticated` tabulkové
  a sekvenční grants jsou odebrané,
  nevzniká policy `USING (true)` ani žádná veřejná policy.
- Lost update: každý stavový update kontroluje expected `version` a atomicky ji
  zvýší.
- Idempotency: scope/key/payload jsou SHA-256; replay stejného payloadu vrací
  původní výsledek, jiný payload je konflikt.
- Atomicity: doménový event i technický audit jsou ve stejné transakci; audit
  failure test vrací claim, jeho položky a event; attachment test vrací DB
  metadata a odstraní už uložený soubor.
- Internal notes: zákaznické SELECT projekce je vůbec nenačítají; HTTP/HTML smoke
  kontroluje jejich absenci.
- Cascade/delete: business a event FK používají RESTRICT; event/audit UPDATE a
  DELETE blokují append-only triggery.
- Refund: `requires_action` je jen refund status; bez uložené provider evidence
  nelze refund return dokončit. DB navíc nedovolí stav `confirmed` bez provider,
  external ID, částky, měny, času a zdroje evidence.
- Delivery: `delivered` vyžaduje `delivered_at`, tracking URL vyžaduje HTTPS a
  carrier allowlist. Doménové return/delivery eventy mají povinný parent.

## Zbývající deployment blockery

1. Skutečná produkční PostgreSQL role PHP na Supabase není v repozitáři
   doložená. Test potvrdil owner roli `vevit` i samostatné skutečné PDO
   přihlášení `vevit_php_test` s explicitním `BYPASSRLS`; před deploymentem se
   musí stejný vědomý model a minimální grants potvrdit pro produkční roli.
2. VeVit Account serverový kontrakt není schválen; account funkce zůstávají
   fail-closed.
3. Individuální admin identity/RBAC nejsou hotové; režim je viditelně legacy.
4. Automatický Stripe refund, webhook refund evidence, antivirus a retenční job
   nejsou implementované. Nedoložený refund zůstává fail-closed; scan stav je
   `not_configured` a MIME allowlist zůstává povinný.
5. Produkční WEDOS/browser/Stripe happy-path E2E nebyl spuštěn a zůstává
   samostatným release gate.
