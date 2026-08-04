<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Značky s počtem aktivních produktů (pro dlaždice značek na homepage)
$stmt = $pdo->query("
  SELECT brand, COUNT(*) AS product_count
  FROM store_products
  WHERE is_active = TRUE AND brand IS NOT NULL AND brand <> ''
  GROUP BY brand
  ORDER BY product_count DESC, brand ASC
");
$brands = $stmt->fetchAll();

echo json_encode(['brands' => $brands]);