-- Dry-run only: run before migration to count affected rows. Do not print token values.
SELECT
  COUNT(*) AS legacy_token_rows,
  COUNT(*) FILTER (WHERE o.status IN ('paid','processing','shipped','delivered')) AS paid_legacy_token_rows,
  COUNT(*) FILTER (WHERE o.status NOT IN ('paid','processing','shipped','delivered')) AS non_paid_legacy_token_rows
FROM store_order_items oi
JOIN store_orders o ON o.id = oi.order_id
WHERE oi.product_type = 'digital' AND oi.download_token IS NOT NULL;
