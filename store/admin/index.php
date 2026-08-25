<?php
require_once __DIR__ . '/middleware.php';
require_once __DIR__ . '/../config.php';
requireAdmin();

$stats = $pdo->query("SELECT COUNT(*) FROM store_products WHERE is_active = 1")->fetchColumn();
$ordersToday = $pdo->query("SELECT COUNT(*) FROM store_orders WHERE created_at::date = CURRENT_DATE")->fetchColumn();
$pending = $pdo->query("SELECT COUNT(*) FROM store_orders WHERE status IN ('pending','processing')")->fetchColumn();
$revenue = $pdo->query("SELECT COALESCE(SUM(total),0) FROM store_orders WHERE status IN ('paid','processing','shipped','delivered')")->fetchColumn();
?>
<!DOCTYPE html>
<html class="dark" lang="cs"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard — Admin</title>
<link rel="stylesheet" href="/assets/css/vevit-tailwind.css">
<link rel="stylesheet" href="/assets/fonts/vevit-fonts.css">
<link rel="stylesheet" href="../assets/css/style.css">

</head>
<body class="bg-background dark:bg-background text-on-surface antialiased flex flex-col min-h-screen md:flex-row">

<!-- Sidebar -->
<aside class="w-full md:w-64 md:min-h-screen bg-surface-container-low border-r border-outline-variant flex-shrink-0 flex flex-col p-gutter">
  <a href="index.php" class="font-display text-h1 font-extrabold text-primary tracking-tighter mb-lg block">VeVit Store</a>
  <nav class="flex flex-col gap-sm">
    <a href="index.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT bg-primary/10 text-primary font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
    </a>
    <a href="products.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">package_2</span> Produkty
    </a>
    <a href="orders.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">shopping_bag</span> Objednávky
    </a>
    <a href="claims.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">Reklamace</a>
    <a href="returns.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">Vrácení</a>
    <a href="deliveries.php" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">Doručení</a>
    <a href="../index.html" class="flex items-center gap-sm px-sm py-sm rounded-DEFAULT text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-body-md transition-colors">
      <span class="material-symbols-outlined text-[18px]">arrow_back</span> Zpět do obchodu
    </a>
  </nav>
</aside>

<!-- Main -->
<main class="flex-1 p-gutter md:p-lg">
  <div class="border border-amber-500/50 bg-amber-500/10 text-amber-100 rounded-DEFAULT p-md mb-md">Administrace používá dočasný sdílený účet. Jednotlivé administrátorské identity zatím nejsou ověřené.</div>
  <h1 class="font-display text-h1 text-on-surface mb-lg">Dashboard</h1>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
    <div class="bg-surface-container border border-outline-variant rounded-DEFAULT p-md">
      <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Celkové tržby</div>
      <div class="font-display text-h1 text-primary"><?= number_format($revenue, 0, ',', ' ') ?> Kč</div>
    </div>
    <div class="bg-surface-container border border-outline-variant rounded-DEFAULT p-md">
      <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Objednávky dnes</div>
      <div class="font-display text-h1 text-on-surface"><?= $ordersToday ?></div>
    </div>
    <div class="bg-surface-container border border-outline-variant rounded-DEFAULT p-md">
      <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Produktů skladem</div>
      <div class="font-display text-h1 text-on-surface"><?= $stats ?></div>
    </div>
    <div class="bg-surface-container border border-outline-variant rounded-DEFAULT p-md">
      <div class="font-caption text-caption text-on-surface-variant uppercase tracking-wider mb-xs">Čekající objednávky</div>
      <div class="font-display text-h1 text-on-surface"><?= $pending ?></div>
    </div>
  </div>
</main>

</body></html>
