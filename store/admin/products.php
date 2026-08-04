<?php
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/../config.php';
requireAdmin();

$action = $_GET['action'] ?? 'list';
$message = $_GET['msg'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    validateCsrf();
    if (isset($_POST['save'])) {
        $id = $_POST['id'] ?? '';
        $data = [
            'name' => trim($_POST['name'] ?? ''),
            'slug' => trim($_POST['slug'] ?? ''),
            'category_id' => $_POST['category_id'] ?: null,
            'description' => trim($_POST['description'] ?? ''),
            'short_desc' => trim($_POST['short_desc'] ?? ''),
            'price' => floatval($_POST['price'] ?? 0),
            'sale_price' => $_POST['sale_price'] ? floatval($_POST['sale_price']) : null,
            'type' => $_POST['type'] ?? 'physical',
            'stock' => $_POST['stock'] !== '' ? intval($_POST['stock']) : null,
            'is_active' => isset($_POST['is_active']) ? 1 : 0,
            'featured' => isset($_POST['featured']) ? 1 : 0,
            'brand' => trim($_POST['brand'] ?? '') !== '' ? trim($_POST['brand']) : null,
        ];
        if (!$data['slug']) $data['slug'] = strtolower(preg_replace('/[^a-z0-9]+/', '-', $data['name']));

        if ($id) {
            $stmt = $pdo->prepare("UPDATE store_products SET name=?, slug=?, category_id=?, description=?, short_desc=?, price=?, sale_price=?, type=?, stock=?, is_active=?, featured=?, brand=? WHERE id=?");
            $stmt->execute([$data['name'], $data['slug'], $data['category_id'], $data['description'], $data['short_desc'], $data['price'], $data['sale_price'], $data['type'], $data['stock'], $data['is_active'], $data['featured'], $data['brand'], $id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO store_products (name, slug, category_id, description, short_desc, price, sale_price, type, stock, is_active, featured, brand, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW())");
            $stmt->execute([$data['name'], $data['slug'], $data['category_id'], $data['description'], $data['short_desc'], $data['price'], $data['sale_price'], $data['type'], $data['stock'], $data['is_active'], $data['featured'], $data['brand']]);
        }
        header('Location: products.php?msg=saved');
        exit;
    }
    if (isset($_POST['delete'])) {
        $id = $_POST['id'] ?? '';
        $pdo->prepare("UPDATE store_products SET is_active = 0 WHERE id = ?")->execute([$id]);
        header('Location: products.php?msg=deleted');
        exit;
    }
}

$categories = $pdo->query("SELECT * FROM store_categories ORDER BY sort_order")->fetchAll();
$products = $pdo->query("SELECT p.*, c.name AS category_name FROM store_products p LEFT JOIN store_categories c ON p.category_id = c.id ORDER BY p.created_at DESC")->fetchAll();

$edit = null;
if ($action === 'edit' && isset($_GET['id'])) {
    $stmt = $pdo->prepare("SELECT * FROM store_products WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    $edit = $stmt->fetch();
}
?>
<!DOCTYPE html>
<html class="dark" lang="cs"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Produkty — Admin</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"><link crossorigin href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css">
<script id="tailwind-config">tailwind.config={darkMode:"class",theme:{extend:{colors:{surface:"#131313","outline-variant":"#3c4a42","on-surface":"#e5e2e1",outline:"#86948a","surface-variant":"#353534","surface-container":"#201f1f","primary-fixed-dim":"#4edea3","surface-container-lowest":"#0e0e0e","surface-container-low":"#1c1b1b",error:"#ffb4ab",primary:"#4edea3",secondary:"#bdc7d9",background:"#131313","surface-container-highest":"#353534","on-surface-variant":"#bbcabf","on-error":"#690005","primary-container":"#10b981","on-primary-container":"#00422b","on-primary":"#003824","surface-dim":"#131313","surface-bright":"#3a3939","on-primary-fixed":"#002113","on-primary-fixed-variant":"#005236"},borderRadius:{DEFAULT:"0.125rem",lg:"0.25rem",xl:"0.5rem",full:"0.75rem"},spacing:{md:"24px",base:"8px",lg:"48px",sm:"12px",xs:"4px",margin:"32px",gutter:"24px",xl:"80px"},fontFamily:{"mono-label":["JetBrains Mono"],display:["Bricolage Grotesque"],"body-lg":["Bricolage Grotesque"],caption:["Bricolage Grotesque"],h2:["Bricolage Grotesque"],h1:["Bricolage Grotesque"],"body-md":["Bricolage Grotesque"]},fontSize:{"mono-label":["14px",{lineHeight:"1.0",letterSpacing:"0.05em",fontWeight:"500"}],display:["48px",{lineHeight:"1.1",letterSpacing:"-0.02em",fontWeight:"800"}],"body-lg":["18px",{lineHeight:"1.6",fontWeight:"400"}],caption:["12px",{lineHeight:"1.4",fontWeight:"500"}],h2:["24px",{lineHeight:"1.3",fontWeight:"700"}],h1:["32px",{lineHeight:"1.2",fontWeight:"700"}],"body-md":["16px",{lineHeight:"1.6",fontWeight:"400"}]}}}};</script>
</head>
<body class="bg-background dark:bg-background text-on-surface antialiased flex flex-col min-h-screen md:flex-row">

<!-- Sidebar -->
<aside class="w-full md:w-64 md:min-h-screen bg-surface-container-low border-r border-outline-variant flex-shrink-0 flex flex-col p-gutter">
  <a href="index.php" class="font-display text-h1 font-extrabold text-primary tracking-tighter mb-lg block">VeVit Store</a>
  <nav class="flex flex-col gap-sm">
    <a href="index.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
    </a>
    <a href="products.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT bg-primary/10 text-primary font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">package_2</span> Produkty
    </a>
    <a href="orders.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
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
    <h1 class="font-display text-h1 text-on-surface">Produkty</h1>
    <a href="products.php?action=edit" class="inline-flex items-center gap-xs bg-primary-container text-on-primary-container font-mono-label text-mono-label py-sm px-md rounded-DEFAULT border border-on-primary-container neo-shadow transition-all hover:opacity-90">
      <span class="material-symbols-outlined text-[16px]">add</span> Přidat produkt
    </a>
  </div>

  <?php if ($message === 'saved'): ?>
  <div class="bg-primary/10 text-primary font-body-md text-body-md px-md py-sm rounded-DEFAULT mb-md">Produkt byl uložen.</div>
  <?php elseif ($message === 'deleted'): ?>
  <div class="bg-primary/10 text-primary font-body-md text-body-md px-md py-sm rounded-DEFAULT mb-md">Produkt byl deaktivován.</div>
  <?php endif; ?>

  <div class="bg-surface-container border border-outline-variant rounded-DEFAULT overflow-x-auto">
    <table class="w-full text-left">
      <thead>
        <tr class="border-b border-outline-variant">
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">ID</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Název</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Kategorie</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Typ</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Cena</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Sklad</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Aktivní</th>
          <th class="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-wider px-md py-sm">Akce</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($products as $p): ?>
        <tr class="border-b border-outline-variant last:border-0 hover:bg-surface-container-high/50 transition-colors">
          <td class="font-body-md text-body-md text-on-surface px-md py-sm"><?= $p['id'] ?></td>
          <td class="font-body-md text-body-md text-on-surface px-md py-sm"><?= h($p['name']) ?></td>
          <td class="font-body-md text-body-md text-on-surface-variant px-md py-sm"><?= h($p['category_name'] ?? '-') ?></td>
          <td class="font-body-md text-body-md text-on-surface-variant px-md py-sm"><?= $p['type'] === 'physical' ? 'Fyzický' : 'Digitální' ?></td>
          <td class="font-body-md text-body-md text-on-surface px-md py-sm"><?= number_format($p['price'], 0, ',', ' ') ?> Kč</td>
          <td class="font-body-md text-body-md text-on-surface-variant px-md py-sm"><?= $p['stock'] !== null ? $p['stock'] : '∞' ?></td>
          <td class="px-md py-sm">
            <span class="inline-block px-sm py-xs rounded-DEFAULT border font-mono-label text-caption <?= $p['is_active'] ? 'text-primary border-primary/30 bg-primary/10' : 'text-error border-error/30 bg-error/10' ?>"><?= $p['is_active'] ? 'Ano' : 'Ne' ?></span>
          </td>
          <td class="px-md py-sm">
            <div class="flex items-center gap-sm">
              <a href="products.php?action=edit&amp;id=<?= $p['id'] ?>" class="inline-flex items-center gap-xs bg-transparent border border-outline-variant text-on-surface font-mono-label text-mono-label py-xs px-sm rounded-DEFAULT hover:border-primary hover:text-primary transition-colors">Upravit</a>
              <form method="post" class="inline">
                <input type="hidden" name="csrf" value="<?= csrfToken() ?>">
                <input type="hidden" name="id" value="<?= $p['id'] ?>">
                <button type="submit" name="delete" class="inline-flex items-center gap-xs bg-transparent border border-error/30 text-error font-mono-label text-mono-label py-xs px-sm rounded-DEFAULT hover:border-error hover:bg-error/10 transition-colors">Smazat</button>
              </form>
            </div>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</main>

<?php if ($action === 'edit'): ?>
<!-- Modal -->
<div class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center p-gutter overflow-y-auto">
  <div class="bg-surface-container border border-outline-variant rounded-DEFAULT w-full max-w-[640px] mt-12 shadow-xl">
    <div class="flex justify-between items-center p-md border-b border-outline-variant">
      <h2 class="font-h2 text-h2 text-on-surface"><?= $edit ? 'Upravit produkt' : 'Nový produkt' ?></h2>
      <a href="products.php" class="text-on-surface-variant hover:text-error transition-colors"><span class="material-symbols-outlined">close</span></a>
    </div>
    <form method="post">
      <div class="p-md flex flex-col gap-md">
        <input type="hidden" name="csrf" value="<?= csrfToken() ?>">
        <?php if ($edit): ?><input type="hidden" name="id" value="<?= $edit['id'] ?>"><?php endif; ?>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Název</label>
            <input type="text" name="name" value="<?= h($edit['name'] ?? '') ?>" required class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
          <div>
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Slug</label>
            <input type="text" name="slug" value="<?= h($edit['slug'] ?? '') ?>" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <div>
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Kategorie</label>
            <select name="category_id" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option value="">—</option>
              <?php foreach ($categories as $cat): ?>
              <option value="<?= $cat['id'] ?>" <?= ($edit['category_id'] ?? '') == $cat['id'] ? 'selected' : '' ?>><?= h($cat['name']) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div>
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Typ</label>
            <select name="type" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
              <option value="physical" <?= ($edit['type'] ?? '') === 'physical' ? 'selected' : '' ?>Fyzický</option>
              <option value="digital" <?= ($edit['type'] ?? '') === 'digital' ? 'selected' : '' ?>Digitální</option>
            </select>
          </div>
          <div>
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Značka</label>
            <input type="text" name="brand" value="<?= h($edit['brand'] ?? '') ?>" placeholder="např. VeVit" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Cena (Kč)</label>
            <input type="number" name="price" step="0.01" value="<?= $edit['price'] ?? '' ?>" required class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
          <div>
            <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Akční cena (Kč)</label>
            <input type="number" name="sale_price" step="0.01" value="<?= $edit['sale_price'] ?? '' ?>" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
          </div>
        </div>

        <div>
          <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Skladové zásoby (prázdné = neomezeno)</label>
          <input type="number" name="stock" value="<?= $edit['stock'] ?? '' ?>" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
        </div>

        <div>
          <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Krátký popis</label>
          <input type="text" name="short_desc" value="<?= h($edit['short_desc'] ?? '') ?>" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
        </div>

        <div>
          <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Popis</label>
          <textarea name="description" rows="3" class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-sm py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 resize-none"><?= h($edit['description'] ?? '') ?></textarea>
        </div>

        <div class="flex gap-md">
          <label class="flex items-center gap-sm font-body-md text-body-md text-on-surface cursor-pointer">
            <input type="checkbox" name="is_active" <?= !isset($edit) || ($edit['is_active'] ?? 1) ? 'checked' : '' ?> class="accent-primary"> Aktivní
          </label>
          <label class="flex items-center gap-sm font-body-md text-body-md text-on-surface cursor-pointer">
            <input type="checkbox" name="featured" <?= ($edit['featured'] ?? 0) ? 'checked' : '' ?> class="accent-primary"> Doporučený
          </label>
        </div>
      </div>
      <div class="flex justify-end gap-sm p-md border-t border-outline-variant">
        <a href="products.php" class="bg-transparent border border-outline-variant text-on-surface font-mono-label text-mono-label py-sm px-md rounded-DEFAULT hover:border-primary hover:text-primary transition-colors">Zrušit</a>
        <button type="submit" name="save" class="bg-primary-container text-on-primary-container font-mono-label text-mono-label py-sm px-md rounded-DEFAULT border border-on-primary-container neo-shadow transition-all hover:opacity-90">Uložit</button>
      </div>
    </form>
  </div>
</div>
<?php endif; ?>

<script src="../assets/js/app.js"></script>
</body></html>
