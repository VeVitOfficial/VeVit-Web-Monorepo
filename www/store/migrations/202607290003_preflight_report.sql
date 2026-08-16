-- Read-only preflight. Any returned row requires manual review before migration.
SELECT 'duplicate_stripe_session' AS issue, stripe_session_id AS value, COUNT(*) AS affected
FROM store_orders WHERE stripe_session_id IS NOT NULL
GROUP BY stripe_session_id HAVING COUNT(*) > 1
UNION ALL
SELECT 'duplicate_payment_intent', stripe_payment_intent, COUNT(*)
FROM store_orders WHERE stripe_payment_intent IS NOT NULL
GROUP BY stripe_payment_intent HAVING COUNT(*) > 1;

SELECT id, order_id, quantity, unit_price
FROM store_order_items
WHERE quantity <= 0 OR unit_price <= 0
ORDER BY id;

SELECT status, COUNT(*) AS affected
FROM store_orders
GROUP BY status
ORDER BY status;
