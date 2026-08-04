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
