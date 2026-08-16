<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Značky s počtem aktivních produktů (pro dlaždice značek na homepage)
if ($storeDataApi instanceof StoreDataApi) {
    $products = $storeDataApi->select('store_products', [
        'select' => 'brand',
        'is_active' => 'eq.true',
        'brand' => 'not.is.null',
        'limit' => '1000',
    ]);
    $counts = [];
    foreach ($products as $product) {
        $productBrand = trim((string) ($product['brand'] ?? ''));
        if ($productBrand !== '') $counts[$productBrand] = ($counts[$productBrand] ?? 0) + 1;
    }
    $brands = array_map(
        static fn (string $name, int $count): array => ['brand' => $name, 'product_count' => $count],
        array_keys($counts),
        array_values($counts),
    );
    usort($brands, static fn (array $a, array $b): int => $b['product_count'] <=> $a['product_count'] ?: strcmp($a['brand'], $b['brand']));
    echo json_encode(['brands' => $brands]);
    exit;
}

$stmt = $pdo->query("
  SELECT brand, COUNT(*) AS product_count
  FROM store_products
  WHERE is_active = TRUE AND brand IS NOT NULL AND brand <> ''
  GROUP BY brand
  ORDER BY product_count DESC, brand ASC
");
$brands = $stmt->fetchAll();

echo json_encode(['brands' => $brands]);
