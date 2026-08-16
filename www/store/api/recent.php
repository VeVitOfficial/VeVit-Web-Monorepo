<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Naposledy prohlížené produkty aktuálního (přihlášeného) uživatele.
// Hostovi vrátíme prázdné — sledování zobrazení se děje jen pro přihlášené.
if ($storeDataApi instanceof StoreDataApi) {
    // Dokud není Store napojený na centrální server-side identitu, nesmí z
    // legacy cookie odvozovat vlastníka historie. Bez identity fail-closed.
    echo json_encode(['products' => []]);
    exit;
}

$user = getCurrentUser();
if (!$user) {
    echo json_encode(['products' => []]);
    exit;
}

$stmt = $pdo->prepare("
  SELECT p.id, p.category_id, p.name, p.slug, p.description, p.short_desc,
         p.price, p.sale_price, p.type, p.stock, p.images, p.brand, p.sku,
         p.currency, p.created_at, p.featured::int AS featured,
         p.is_active::int AS is_active, p.is_sellable::int AS is_sellable,
         p.allow_backorder::int AS allow_backorder,
         c.name AS category_name, c.slug AS category_slug
  FROM store_product_views v
  JOIN store_products p ON v.product_id = p.id AND p.is_active = TRUE
  LEFT JOIN store_categories c ON p.category_id = c.id
  WHERE v.user_id = ?
  ORDER BY v.viewed_at DESC
  LIMIT 8
");
$stmt->execute([$user['id']]);
$products = $stmt->fetchAll();

echo json_encode(['products' => $products]);
