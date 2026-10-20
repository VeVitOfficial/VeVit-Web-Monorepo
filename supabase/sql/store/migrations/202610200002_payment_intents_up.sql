-- Phase 1 of the custom payment gateway: provider/method bookkeeping on orders.
-- payment_attempts counts declined confirmations (limit enforced by the app);
-- payment_intent_seq is the PaymentIntent generation used in the Stripe idempotency key.
BEGIN;

ALTER TABLE store_orders
    ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(16) NOT NULL DEFAULT 'stripe',
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(24) NULL,
    ADD COLUMN IF NOT EXISTS payment_attempts INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_intent_seq INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_payment_error VARCHAR(64) NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_orders_payment_provider_check') THEN
    ALTER TABLE store_orders ADD CONSTRAINT store_orders_payment_provider_check
      CHECK (payment_provider IN ('stripe', 'gopay'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_orders_payment_method_check') THEN
    ALTER TABLE store_orders ADD CONSTRAINT store_orders_payment_method_check
      CHECK (payment_method IS NULL OR payment_method IN ('card', 'apple_pay', 'google_pay', 'paypal', 'bank_button', 'paysafecard'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_orders_payment_counters_check') THEN
    ALTER TABLE store_orders ADD CONSTRAINT store_orders_payment_counters_check
      CHECK (payment_attempts >= 0 AND payment_intent_seq >= 0);
  END IF;
END $$;

-- Already created by 202607290003; kept here so the phase is self-contained.
CREATE UNIQUE INDEX IF NOT EXISTS uq_store_orders_payment_intent
    ON store_orders(stripe_payment_intent) WHERE stripe_payment_intent IS NOT NULL;

COMMIT;
