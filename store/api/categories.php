<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Categories with item counts (only categories that have at least one active
// product are useful for the storefront bento grid, but we return all so the
// client can decide).
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