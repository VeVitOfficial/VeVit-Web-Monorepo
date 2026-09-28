-- 022: Doprava ve VeVit Store zdarma jako výhoda tarifu (Silver a výš).
-- Checkout (src/lib/store-checkout-service.ts) čte free_shipping efektivního
-- tarifu přihlášeného zákazníka a nastaví shipping_minor = 0.
alter table public.tiers
  add column if not exists free_shipping boolean not null default false;

update public.tiers
set free_shipping = key in ('silver', 'gold', 'platinum');
