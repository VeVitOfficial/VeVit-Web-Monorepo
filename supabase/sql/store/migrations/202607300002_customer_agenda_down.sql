BEGIN;

DO $$
DECLARE table_name text; row_total bigint;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'store_claim_events','store_claim_items','store_claims',
    'store_return_events','store_return_items','store_returns',
    'store_delivery_events','store_delivery_items','store_deliveries',
    'store_case_attachments','store_product_favorites','store_audit_events'
  ] LOOP
    EXECUTE format('SELECT count(*) FROM %I', table_name) INTO row_total;
    IF row_total > 0 THEN
      RAISE EXCEPTION 'Guarded down refused: table % contains % customer/audit rows. Restore the verified backup instead.', table_name, row_total;
    END IF;
  END LOOP;
END $$;

DROP TABLE store_case_attachments;
DROP TABLE store_product_favorites;
DROP TABLE store_delivery_events;
DROP TABLE store_delivery_items;
DROP TABLE store_deliveries;
DROP TABLE store_return_events;
DROP TABLE store_return_items;
DROP TABLE store_returns;
DROP TABLE store_claim_events;
DROP TABLE store_claim_items;
DROP TABLE store_claims;
DROP TABLE store_audit_events;
DROP FUNCTION vevit_customer_agenda_reject_append_only_change();
DO $$ BEGIN
 IF EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conrelid='public.store_order_items'::regclass
     AND conname='uq_store_order_items_order_id_id'
     AND obj_description(oid,'pg_constraint')='owned by migration 202607300002_customer_agenda_up'
 ) THEN
   ALTER TABLE store_order_items DROP CONSTRAINT uq_store_order_items_order_id_id;
 END IF;
END $$;

COMMIT;
