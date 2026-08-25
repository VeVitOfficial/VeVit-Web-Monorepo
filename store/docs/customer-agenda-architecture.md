# Customer agenda — hranice modulárního monolitu

Objednávkové jádro zůstává výhradně v `store_orders`, `store_order_items` a
`store_products`. Nevznikla paralelní objednávková tabulka ani polymorfní case
engine.

| Modul | Veřejná služba | Vlastněná data |
|---|---|---|
| Claims | `ClaimService` | claims, claim items, claim events |
| Returns | `ReturnService` | returns, return items, return events, refund stav |
| Delivery | `DeliveryService` | deliveries, delivery items/events, tracking |
| Attachments | `AttachmentService`, `LocalPrivateStorage` | metadata a privátní objekty |
| Favorites | `FavoriteService` | account-only favorites |
| Admin | `AdminMutationService` | pouze směrování do doménových služeb |

Sdílené komponenty jsou `AuthContext`, `ActorContext`, `OrderAccessService`,
`CaseQuantityAvailability`, `Transactional`, `AuditService`, HTTP/CSRF/rate
limit helpery a technický event envelope. Views neprovádějí SQL. Endpoint
neprovádí stavové SQL ani neotevírá business transakci.

## Transakční hranice

Create a state mutation jsou uzavřeny v jedné službové transakci. Zámky
`store_order_items` se berou ve vzestupném ID. Selhání položky, doménového eventu
nebo technického auditu vrátí zpět celou operaci. Attachments po DB rollbacku
odstraní už uložený objekt.

Jediný autoritativní množstevní výpočet je:

```text
eligible_quantity
= purchased_quantity
- final_claim_consumed_quantity
- final_return_consumed_quantity
- active_claim_reserved_quantity
- active_return_reserved_quantity
```

Claims rezervují `submitted`, `under_review`, `waiting_for_customer`, `accepted`;
finální spotřeba vznikne pouze serverově při `resolved`. Returns rezervují
`requested`, `approved`, `waiting_for_goods`, `received`, `inspected`,
`refund_pending`; finální spotřeba vznikne pouze serverově při bezpečném
`completed`. Rejected/cancelled nerezervují a mají nulovou spotřebu. Částečné
schválení spotřebuje jen schválené/zkontrolované množství. Finální spotřeba se
nikdy znovu neuvolní běžnou mutací.

## Zakázané přímé vazby

- Claims neaktualizuje Returns a naopak.
- Returns neaktualizuje payment ledger a netvrdí refund bez evidence.
- Delivery nemění payment status.
- Attachments nerozhoduje vlastnictví bez parent autorizace.
- Favorites nepřijímá user ID z klienta.
- Business služby nevolají VeVit Account.
- Filesystem operace jsou pouze v `LocalPrivateStorage`.

## Legacy admin

Každá relace má vlastní 256bit raw audit hodnotu pouze v serverové session; v DB
je SHA-256. Actor je vždy `legacy_shared_admin`, user ID je `NULL`. Stavové
mutace jsou POST + CSRF + origin check + rate limit + state machine + expected
version + event + audit. Vytvoření nové zásilky také prochází touto službou a
společným quantity guardem. Neexistuje role management, bulk mutation, audit delete
ani endpoint pro nedoložené potvrzení refundu.

Navazující blokující task: individuální admin identity, stabilní admin user ID,
role/oprávnění, migrace auditu na konkrétní identity a zneplatnění sdíleného
hesla.
