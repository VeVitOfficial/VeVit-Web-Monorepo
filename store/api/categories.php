<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Categories with item counts (only categories that have at least one active
// product are useful for the storefront bento grid, but we return all so the
// client can decide).
if ($storeDataApi instanceof StoreDataApi) {
    $categories = $storeDataApi->select('store_categories', [
        'select' => 'id,name,slug,icon,sort_order,parent_id',
        'order' => 'sort_order.asc',
        'limit' => '1000',
    ]);
    $products = $storeDataApi->select('store_products', [
        'select' => 'category_id',
        'is_active' => 'eq.true',
        'limit' => '1000',
    ]);
    $counts = array_count_values(array_map(static fn (array $product): string => (string) $product['category_id'], $products));
    foreach ($categories as &$category) {
        $category['product_count'] = $counts[(string) $category['id']] ?? 0;
    }
    unset($category);
    echo json_encode(['categories' => $categories]);
    exit;
}

$catStmt = $pdo->query("
  SELECT c.id, c.name, c.slug, c.icon, c.sort_order, c.parent_id,
         COUNT(p.id) AS product_count
  FROM store_categories c
  LEFT JOIN store_products p ON p.category_id = c.id AND p.is_active = TRUE
  GROUP BY c.id, c.name, c.slug, c.icon, c.sort_order, c.parent_id
  ORDER BY c.sort_order
");
$categories = $catStmt->fetchAll();

echo json_encode(['categories' => $categories]);
