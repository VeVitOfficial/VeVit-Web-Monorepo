-- VeVit Store customer agenda preflight report.
-- Read manually before the customer-agenda schema migration. This file is read-only.

SELECT c.relname AS table_name,
       c.relkind AS relation_kind,
       pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND c.relname LIKE 'store_%'
ORDER BY c.relname;

SELECT table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'store_%'
ORDER BY table_name, ordinal_position;

SELECT t.typname AS enum_name, e.enumsortorder, e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
JOIN pg_enum e ON e.enumtypid = t.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

SELECT con.conname AS constraint_name,
       rel.relname AS table_name,
       pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relname LIKE 'store_%'
  AND con.contype IN ('p', 'u', 'f', 'c')
ORDER BY rel.relname, con.conname;

SELECT tablename AS table_name, indexname AS index_name, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'store_%'
ORDER BY tablename, indexname;

SELECT candidate_name,
       to_regclass('public.' || candidate_name) AS existing_relation
FROM (VALUES
    ('store_claims'), ('store_claim_items'), ('store_claim_events'),
    ('store_returns'), ('store_return_items'), ('store_return_events'),
    ('store_deliveries'), ('store_delivery_items'), ('store_delivery_events'),
    ('store_case_attachments'), ('store_product_favorites'), ('store_audit_events')
) AS candidates(candidate_name)
ORDER BY candidate_name;

SELECT 'order_item_non_positive_quantity' AS anomaly, COUNT(*)::bigint AS affected_rows
FROM store_order_items WHERE quantity <= 0
UNION ALL
SELECT 'order_public_id_not_lower_hex_32', COUNT(*)::bigint
FROM store_orders WHERE public_id IS NOT NULL AND public_id !~ '^[a-f0-9]{32}$'
UNION ALL
SELECT 'guest_grant_hash_not_sha256_hex', COUNT(*)::bigint
FROM store_orders WHERE guest_grant_hash IS NOT NULL AND guest_grant_hash !~ '^[a-f0-9]{64}$'
UNION ALL
SELECT 'guest_grant_hash_without_expiry', COUNT(*)::bigint
FROM store_orders WHERE (guest_grant_hash IS NULL) <> (guest_grant_expires_at IS NULL)
UNION ALL
SELECT 'duplicate_order_public_id', COUNT(*)::bigint
FROM (SELECT public_id FROM store_orders WHERE public_id IS NOT NULL GROUP BY public_id HAVING COUNT(*)>1) duplicate_ids
UNION ALL
SELECT 'order_item_missing_order', COUNT(*)::bigint
FROM store_order_items oi LEFT JOIN store_orders o ON o.id=oi.order_id WHERE o.id IS NULL
UNION ALL
SELECT 'product_invalid_type', COUNT(*)::bigint
FROM store_products WHERE type NOT IN ('physical','digital')
ORDER BY anomaly;

SELECT 'order_status' AS value_family,status AS value,COUNT(*)::bigint AS rows
FROM store_orders GROUP BY status
UNION ALL
SELECT 'payment_status',payment_status,COUNT(*)::bigint
FROM store_orders GROUP BY payment_status
UNION ALL
SELECT 'fulfillment_status',fulfillment_status,COUNT(*)::bigint
FROM store_orders GROUP BY fulfillment_status
ORDER BY value_family,value;

SELECT current_user AS database_role,
       r.rolsuper,
       r.rolbypassrls,
       r.rolinherit
FROM pg_roles r
WHERE r.rolname=current_user;

SELECT c.relname AS table_name,c.relrowsecurity AS rls_enabled,
       COALESCE(array_to_string(c.relacl,','),'') AS acl
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname LIKE 'store_%' AND c.relkind IN ('r','p')
ORDER BY c.relname;
