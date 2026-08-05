<?php
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

$category = $_GET['category'] ?? '';
$type = $_GET['type'] ?? '';
$search = $_GET['search'] ?? '';
$sort = $_GET['sort'] ?? 'featured';
$brand = $_GET['brand'] ?? '';
$deals = !empty($_GET['deals']);
$maxPrice = isset($_GET['max_price']) ? (float) $_GET['max_price'] : 10000;
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
// per_page volitelné (homepage řádky chtějí méně), s bezpečným rozsahem
$perPage = isset($_GET['per_page']) ? max(1, min(48, (int) $_GET['per_page'])) : 12;

if ($storeDataApi instanceof StoreDataApi) {
    $products = $storeDataApi->select('store_products', [
        'select' => 'id,category_id,name,slug,description,short_desc,price,sale_price,type,stock,images,brand,created_at,featured,is_active,store_categories(name,slug)',
        'is_active' => 'eq.true',
        'limit' => '1000',
    ]);
    $categorySlugs = array_values(array_filter(array_map('trim', explode(',', $category))));
    $products = array_values(array_filter($products, static function (array $product) use ($categorySlugs, $type, $brand, $deals, $search, $maxPrice): bool {
        $productCategory = $product['store_categories']['slug'] ?? null;
        $effectivePrice = $product['sale_price'] !== null ? (float) $product['sale_price'] : (float) $product['price'];
        if ($categorySlugs !== [] && !in_array($productCategory, $categorySlugs, true)) return false;
        if ($type !== '' && in_array($type, ['physical', 'digital'], true) && ($product['type'] ?? null) !== $type) return false;
        if ($brand !== '' && ($product['brand'] ?? null) !== $brand) return false;
        if ($deals && ($product['sale_price'] === null || (float) $product['sale_price'] <= 0)) return false;
        if ($effectivePrice > $maxPrice) return false;
        if ($search !== '') {
            $haystack = mb_strtolower((string) ($product['name'] ?? '') . ' ' . (string) ($product['short_desc'] ?? ''));
            if (!str_contains($haystack, mb_strtolower($search))) return false;
        }
        return true;
    }));
    usort($products, static function (array $left, array $right) use ($sort): int {
        $leftPrice = $left['sale_price'] !== null ? (float) $left['sale_price'] : (float) $left['price'];
        $rightPrice = $right['sale_price'] !== null ? (float) $right['sale_price'] : (float) $right['price'];
        return match ($sort) {
            'newest' => strcmp((string) $right['created_at'], (string) $left['created_at']),
            'cheapest' => $leftPrice <=> $rightPrice,
            'expensive' => $rightPrice <=> $leftPrice,
            default => ((int) ($right['featured'] ?? 0) <=> (int) ($left['featured'] ?? 0))
                ?: strcmp((string) $right['created_at'], (string) $left['created_at']),
        };
    });
    $total = count($products);
    $totalPages = max(1, (int) ceil($total / $perPage));
    $page = min($page, $totalPages);
    $products = array_slice($products, ($page - 1) * $perPage, $perPage);
    foreach ($products as &$product) {
        $product['featured'] = (int) ($product['featured'] ?? 0);
        $product['is_active'] = (int) ($product['is_active'] ?? 0);
        $product['category_name'] = $product['store_categories']['name'] ?? null;
        $product['category_slug'] = $product['store_categories']['slug'] ?? null;
        unset($product['store_categories']);
    }
    unset($product);
    echo json_encode(['products' => $products, 'page' => $page, 'total_pages' => $totalPages, 'total' => $total]);
    exit;
}

$where = ['p.is_active = TRUE'];
$params = [];

if ($category) {
    $slugs = array_map('trim', explode(',', $category));
    $placeholders = implode(',', array_fill(0, count($slugs), '?'));
    $where[] = "c.slug IN ($placeholders)";
    $params = array_merge($params, $slugs);
}
if ($type && in_array($type, ['physical', 'digital'])) {
    $where[] = 'p.type = ?';
    $params[] = $type;
}
if ($brand) {
    $where[] = 'p.brand = ?';
    $params[] = $brand;
}
if ($deals) {
    $where[] = 'p.sale_price IS NOT NULL AND p.sale_price > 0';
}
if ($search) {
    $where[] = '(p.name ILIKE ? OR p.short_desc ILIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}
$where[] = 'COALESCE(p.sale_price, p.price) <= ?';
$params[] = $maxPrice;

$order = match ($sort) {
    'newest' => 'p.created_at DESC',
    'cheapest' => 'COALESCE(p.sale_price, p.price) ASC',
    'expensive' => 'COALESCE(p.sale_price, p.price) DESC',
    'bestselling' => '(SELECT COALESCE(SUM(oi.quantity), 0) FROM store_order_items oi
                       JOIN store_orders o ON oi.order_id = o.id
                       WHERE oi.product_id = p.id AND o.status IN (\'paid\',\'shipped\',\'delivered\')) DESC, p.created_at DESC',
    default => 'p.featured DESC, p.created_at DESC'
};

$whereSql = implode(' AND ', $where);

$countStmt = $pdo->prepare("SELECT COUNT(*) FROM store_products p LEFT JOIN store_categories c ON p.category_id = c.id WHERE $whereSql");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();
$totalPages = max(1, (int) ceil($total / $perPage));
$page = min($page, $totalPages);

$offset = ($page - 1) * $perPage;
$stmt = $pdo->prepare(
    "SELECT p.id, p.category_id, p.name, p.slug, p.description, p.short_desc,
            p.price, p.sale_price, p.type, p.stock, p.images, p.brand,
            p.created_at, p.featured::int AS featured,
            p.is_active::int AS is_active,
            c.name AS category_name, c.slug AS category_slug
       FROM store_products p
       LEFT JOIN store_categories c ON p.category_id = c.id
      WHERE $whereSql
      ORDER BY $order
      LIMIT $perPage OFFSET $offset"
);
$stmt->execute($params);
$products = $stmt->fetchAll();

echo json_encode([
    'products' => $products,
    'page' => $page,
    'total_pages' => $totalPages,
    'total' => $total
]);
