<?php
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/../config.php';
requireAdmin();

$statusFilter = $_GET['status'] ?? '';
$search = $_GET['search'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    validateCsrf();
    if (isset($_POST['update_status'])) {
        $id = (int) ($_POST['order_id'] ?? 0);
        $newStatus = $_POST['new_status'] ?? '';
        if ($id && in_array($newStatus, ['pending','paid','processing','shipped','delivered','cancelled','refunded'])) {
            $pdo->prepare("UPDATE store_orders SET status = ? WHERE id = ?")
                ->execute([$newStatus, $id]);
        }
        header('Location: orders.php' . ($statusFilter ? '?status=' . urlencode($statusFilter) : ''));
        exit;
    }
    if (isset($_POST['add_note'])) {
        $id = (int) ($_POST['order_id'] ?? 0);
        $note = trim($_POST['note'] ?? '');
        if ($id && $note) {
            $current = $pdo->prepare("SELECT notes FROM store_orders WHERE id = ?")->fetchColumn();
            $updated = ($current ? $current . "\n" : '') . date('Y-m-d H:i') . ': ' . $note;
            $pdo->prepare("UPDATE store_orders SET notes = ? WHERE id = ?")
                ->execute([$updated, $id]);
        }
        header('Location: orders.php?view=' . $id);
        exit;
    }
}

$viewId = isset($_GET['view']) ? (int) $_GET['view'] : 0;
$orderDetail = null;
if ($viewId) {
    $stmt = $pdo->prepare("SELECT * FROM store_orders WHERE id = ?");
    $stmt->execute([$viewId]);
    $orderDetail = $stmt->fetch();
    if ($orderDetail) {
        $itemsStmt = $pdo->prepare("SELECT * FROM store_order_items WHERE order_id = ?");
        $itemsStmt->execute([$viewId]);
        $orderDetail['items'] = $itemsStmt->fetchAll();
    }
}

$where = ['1=1'];
$params = [];
if ($statusFilter) {
    $where[] = 'o.status = ?';
    $params[] = $statusFilter;
}
if ($search) {
    $where[] = '(o.order_number LIKE ? OR o.customer_email LIKE ? OR o.customer_name LIKE ?)';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
    $params[] = '%' . $search . '%';
}
$whereSql = implode(' AND ', $where);

$orders = $pdo->prepare("SELECT o.*, COUNT(oi.id) as item_count FROM store_orders o LEFT JOIN store_order_items oi ON o.id = oi.order_id WHERE $whereSql GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200");
$orders->execute($params);
$orders = $orders->fetchAll();

$statuses = ['pending' => 'Čeká', 'paid' => 'Zaplaceno', 'processing' => 'Zpracovává se', 'shipped' => 'Odesláno', 'delivered' => 'Doručeno', 'cancelled' => 'Zrušeno', 'refunded' => 'Vráceno'];

$statusColors = [
  'pending' => 'text-on-surface-variant',
  'paid' => 'text-primary',
  'processing' => 'text-primary',
  'shipped' => 'text-primary',
  'delivered' => 'text-primary',
  'cancelled' => 'text-error',
  'refunded' => 'text-error',
];
?>
<!DOCTYPE html>
<html class="dark" lang="cs"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Objednávky — Admin</title>
<link rel="stylesheet" href="/assets/css/vevit-tailwind.css">
<link rel="stylesheet" href="/assets/fonts/vevit-fonts.css">
<link rel="stylesheet" href="../assets/css/style.css">

</head>
<body class="bg-background dark:bg-background text-on-surface antialiased flex flex-col min-h-screen md:flex-row">

<!-- Sidebar -->
<aside class="w-full md:w-64 md:min-h-screen bg-surface-container-low border-r border-outline-variant flex-shrink-0 flex flex-col p-gutter">
  <a href="index.php" class="font-display text-h1 font-extrabold text-primary tracking-tighter mb-lg block">VeVit Store</a>
  <nav class="flex flex-col gap-sm">
    <a href="index.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
    </a>
    <a href="products.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">package_2</span> Produkty
    </a>
    <a href="orders.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT bg-primary/10 text-primary font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">shopping_bag</span> Objednávky
    </a>
    <a href="../index.html" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">arrow_back</span> Zpět do obchodu
    </a>
  </nav>
</aside>

<!-- Main -->
<main class="flex-1 p-gutter md:p-lg">
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-sm mb-lg">
    <h1 class="font-display text-h1 text-on-surface">Objednávky</h1>
    <form method="get" class="flex items-center gap-sm">
      <select name="status" data-submit-on-change class="bg-surface border border-outline-variant text-on-surface font-body-md rounded-DEFAULT px-sm py-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
        <option value="">Všechny stavy</option>
        <?php foreach ($statuses as $k => $v): ?>
        <option value="<?= $k ?>" <?= $statusFilter === $k ? 'selected' : '' ?>><?= $v ?></option>
        <?php endforeach; ?>
      </select>
      <input type="text" name="search" placeholder="Hledat..." value="<?= h($search) ?>" class="w-48 bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
      <button type="submit" class="bg-primary-container text-on-primary-container font-mono-label text-mono-label py-sm px-md rounded-DEFAULT border border-on-primary-container neo-shadow transition-all hover:opacity-90">Hledat</button>
    </form>
  </div>

  <div class="bg-surface-container border border-outline-variant rounded-DEFAULT overflow-x-auto">
    <table class="w-full text-left">
      <thead>
        <tr class="border-b border-outline-variant">
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Číslo</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Datum</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Zákazník</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Položky</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Celkem</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Stav</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Akce</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($orders as $o): ?>
        <tr class="border-b border-outline-variant last:border-0 hover:bg-surface-container-high/50 transition-colors">
          <td class="font-body-md text-body-md text-on-surface px-md py-sm"><?= h($o['order_number']) ?></td>
          <td class="font-body-md text-body-md text-on-surface-variant px-md py-sm"><?= date('d.m.Y H:i', strtotime($o['created_at'])) ?></td>
          <td class="px-md py-sm">
            <div class="font-body-md text-body-md text-on-surface"><?= h($o['customer_name']) ?></div>
            <div class="font-caption text-caption text-on-surface-variant"><?= h($o['customer_email']) ?></div>
          </td>
          <td class="font-body-md text-body-md text-on-surface px-md py-sm"><?= $o['item_count'] ?></td>
          <td class="font-body-md text-body-md text-on-surface px-md py-sm"><?= number_format($o['total'], 0, ',', ' ') ?> Kč</td>
          <td class="px-md py-sm">
            <span class="inline-block px-sm py-xs rounded-DEFAULT border font-mono-label text-caption <?= $statusColors[$o['status']] ?? 'text-on-surface-variant' ?> border-outline-variant bg-surface"><?= $statuses[$o['status']] ?? $o['status'] ?></span>
          </td>
          <td class="px-md py-sm">
            <a href="orders.php?view=<?= $o['id'] ?><?= $statusFilter ? '&status=' . urlencode($statusFilter) : '' ?>" class="inline-flex items-center gap-xs bg-transparent border border-outline-variant text-on-surface font-mono-label text-mono-label py-xs px-sm rounded-DEFAULT hover:border-primary hover:text-primary transition-colors">Detail</a>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</main>

<?php if ($orderDetail): ?>
<!-- Modal -->
<div class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-gutter overflow-y-auto">
  <div class="bg-surface-container border border-outline-variant rounded-DEFAULT w-full max-w-[640px] mt-12 shadow-xl">
    <div class="flex justify-between items-center p-md border-b border-outline-variant">
      <h2 class="font-h2 text-h2 text-on-surface">Objednávka <?= h($orderDetail['order_number']) ?></h2>
      <a href="orders.php<?= $statusFilter ? '?status=' . urlencode($statusFilter) : '' ?>" class="text-on-surface-variant hover:text-error transition-colors"><span class="material-symbols-outlined">close</span></a>
    </div>
    <div class="p-md flex flex-col gap-md">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <div>
          <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Zákazník</div>
          <div class="font-body-md text-body-md text-on-surface"><?= h($orderDetail['customer_name']) ?></div>
          <div class="font-caption text-caption text-on-surface-variant"><?= h($orderDetail['customer_email']) ?></div>
        </div>
        <div>
          <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Datum</div>
          <div class="font-body-md text-body-md text-on-surface"><?= date('d.m.Y H:i', strtotime($orderDetail['created_at'])) ?></div>
        </div>
      </div>

      <?php if ($orderDetail['shipping_address']): ?>
      <div>
        <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Doručovací adresa</div>
        <div class="font-body-md text-body-md text-on-surface whitespace-pre-wrap"><?= nl2br(h($orderDetail['shipping_address'])) ?></div>
      </div>
      <?php endif; ?>

      <div>
        <h3 class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider mb-sm">Položky objednávky</h3>
        <?php foreach ($orderDetail['items'] as $item): ?>
        <div class="flex justify-between items-center py-sm border-b border-outline-variant last:border-0">
          <div>
            <div class="font-body-md text-body-md text-on-surface"><?= h($item['product_name']) ?></div>
            <div class="font-caption text-caption text-on-surface-variant"><?= $item['quantity'] ?> ks × <?= number_format($item['unit_price'], 0, ',', ' ') ?> Kč</div>
          </div>
          <div class="font-body-md text-body-md text-on-surface font-bold"><?= number_format($item['quantity'] * $item['unit_price'], 0, ',', ' ') ?> Kč</div>
        </div>
        <?php endforeach; ?>
        <div class="flex justify-between items-center pt-sm">
          <span class="font-h2 text-h2 text-on-surface">Celkem</span>
          <span class="font-display text-h1 text-primary"><?= number_format($orderDetail['total'], 0, ',', ' ') ?> Kč</span>
        </div>
      </div>

      <?php if ($orderDetail['notes']): ?>
      <div>
        <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Poznámky</div>
        <pre class="bg-surface border border-outline-variant rounded-DEFAULT p-sm font-caption text-caption text-on-surface whitespace-pre-wrap"><?= h($orderDetail['notes']) ?></pre>
      </div>
      <?php endif; ?>

      <form method="post" class="flex flex-col gap-md">
        <input type="hidden" name="csrf" value="<?= csrfToken() ?>">
        <input type="hidden" name="order_id" value="<?= $orderDetail['id'] ?>">
        <div class="flex flex-col sm:flex-row gap-sm items-end">
          <div class="flex-1 w-full">
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Změnit stav</label>
            <select name="new_status" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <?php foreach ($statuses as $k => $v): ?>
              <option value="<?= $k ?>" <?= $orderDetail['status'] === $k ? 'selected' : '' ?>><?= $v ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <button type="submit" name="update_status" class="bg-primary-container text-on-primary-container font-mono-label text-mono-label py-sm px-md rounded-DEFAULT border border-on-primary-container neo-shadow transition-all hover:opacity-90 whitespace-nowrap">Uložit</button>
        </div>
      </form>

      <form method="post" class="flex gap-sm">
        <input type="hidden" name="csrf" value="<?= csrfToken() ?>">
        <input type="hidden" name="order_id" value="<?= $orderDetail['id'] ?>">
        <input type="text" name="note" placeholder="Přidat poznámku..." class="flex-1 bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
        <button type="submit" name="add_note" class="bg-transparent border border-outline-variant text-on-surface font-mono-label text-mono-label py-sm px-md rounded-DEFAULT hover:border-primary hover:text-primary transition-colors">Přidat</button>
      </form>
    </div>
  </div>
</div>
<?php endif; ?>

<script src="../assets/js/app.js"></script>
</body></html>
