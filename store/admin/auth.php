<?php

declare(strict_types=1);

$secretConfigPath = __DIR__ . '/../config_secret.php';
if (!is_file($secretConfigPath) || !is_readable($secretConfigPath)) {
    error_log('[admin bootstrap] Missing or unreadable config_secret.php');
    http_response_code(500);
    exit('Služba je dočasně nedostupná.');
}

require_once $secretConfigPath;
require_once __DIR__ . '/../lib/config.php';
require_once __DIR__ . '/../lib/session.php';
require_once __DIR__ . '/../lib/auth/ActorContext.php';
require_once __DIR__ . '/../lib/admin/LegacyAdminActor.php';
require_once __DIR__ . '/../lib/http.php';
require_once __DIR__ . '/../lib/RateLimiter.php';

try {
    $adminConfig = store_load_config();
    store_start_session($adminConfig['session']);
    $adminPdo = store_connect_database($adminConfig);
} catch (Throwable $exception) {
    error_log(sprintf('[admin bootstrap] %s', $exception->getMessage()));
    http_response_code(500);
    exit('Služba je dočasně nedostupná.');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $attempts = array_values(array_filter($_SESSION['_admin_login_attempts'] ?? [], static fn ($at): bool => is_int($at) && $at > time() - 900));
    if (!store_verify_csrf_token('admin_login', $_POST['csrf'] ?? null)) {
        http_response_code(403);
        $error = 'Platnost formuláře vypršela.';
    } else {
        $remoteAddress = filter_var($_SERVER['REMOTE_ADDR'] ?? '', FILTER_VALIDATE_IP);
        try {
            (new StoreRateLimiter($adminPdo))->consume(
                'admin_login',
                is_string($remoteAddress) ? $remoteAddress : 'unknown_remote',
                8,
                900
            );
            $databaseRateLimited = false;
        } catch (StoreRateLimitExceeded) {
            $databaseRateLimited = true;
        }
        if ($databaseRateLimited || count($attempts) >= 8) {
            http_response_code(429);
            $error = 'Příliš mnoho pokusů. Zkuste to později.';
        } else {
            $password = $_POST['password'] ?? '';
            if (!is_string($password) || strlen($password) > 4096) {
                $password = '';
            }
            $configuredAdminHash = getenv('ADMIN_PASSWORD_HASH');
            if ($configuredAdminHash === false || $configuredAdminHash === '') {
                $configuredAdminHash = defined('ADMIN_PASSWORD_HASH') ? (string) ADMIN_PASSWORD_HASH : '';
            }
            if ($configuredAdminHash !== '' && password_verify($password, $configuredAdminHash)) {
                unset($_SESSION['_admin_login_attempts']);
                session_regenerate_id(true);
                $_SESSION['admin'] = true;
                LegacyAdminActor::establish($_SESSION, time());
                header('Location: index.php');
                exit;
            }
            $attempts[] = time();
            $_SESSION['_admin_login_attempts'] = $attempts;
            $error = 'Neplatné heslo.';
        }
    }
}
?>
<!DOCTYPE html>
<html class="dark" lang="cs"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — VeVit Store</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"><link crossorigin href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css">
<script id="tailwind-config">tailwind.config={darkMode:"class",theme:{extend:{colors:{surface:"#131313","outline-variant":"#3c4a42","on-surface":"#e5e2e1",outline:"#86948a","surface-variant":"#353534","surface-container":"#201f1f","primary-fixed-dim":"#4edea3","surface-container-lowest":"#0e0e0e","surface-container-low":"#1c1b1b",error:"#ffb4ab",primary:"#4edea3",secondary:"#bdc7d9",background:"#131313","surface-container-highest":"#353534","on-surface-variant":"#bbcabf","on-error":"#690005","primary-container":"#10b981","on-primary-container":"#00422b","on-primary":"#003824","surface-dim":"#131313","surface-bright":"#3a3939","on-primary-fixed":"#002113","on-primary-fixed-variant":"#005236"},borderRadius:{DEFAULT:"0.125rem",lg:"0.25rem",xl:"0.5rem",full:"0.75rem"},spacing:{md:"24px",base:"8px",lg:"48px",sm:"12px",xs:"4px",margin:"32px",gutter:"24px",xl:"80px"},fontFamily:{"mono-label":["JetBrains Mono"],display:["Bricolage Grotesque"],"body-lg":["Bricolage Grotesque"],caption:["Bricolage Grotesque"],h2:["Bricolage Grotesque"],h1:["Bricolage Grotesque"],"body-md":["Bricolage Grotesque"]},fontSize:{"mono-label":["14px",{lineHeight:"1.0",letterSpacing:"0.05em",fontWeight:"500"}],display:["48px",{lineHeight:"1.1",letterSpacing:"-0.02em",fontWeight:"800"}],"body-lg":["18px",{lineHeight:"1.6",fontWeight:"400"}],caption:["12px",{lineHeight:"1.4",fontWeight:"500"}],h2:["24px",{lineHeight:"1.3",fontWeight:"700"}],h1:["32px",{lineHeight:"1.2",fontWeight:"700"}],"body-md":["16px",{lineHeight:"1.6",fontWeight:"400"}]}}}};</script>
</head>
<body class="bg-background dark:bg-background text-on-surface antialiased flex flex-col min-h-screen">

<main class="flex-grow flex items-center justify-center px-margin py-xl">
  <div class="w-full max-w-sm">
    <div class="bg-surface-container border border-outline-variant rounded-DEFAULT p-lg">
      <div class="text-center mb-lg">
        <div class="w-12 h-12 rounded-DEFAULT bg-primary flex items-center justify-center mx-auto mb-sm">
          <span class="material-symbols-outlined text-[24px] text-on-primary">lock</span>
        </div>
        <h1 class="font-h2 text-h2 text-on-surface">Admin přihlášení</h1>
        <p class="font-caption text-caption text-on-surface-variant mt-xs">VeVit Store</p>
      </div>

      <?php if ($error): ?>
      <div class="bg-error/10 text-error font-body-md text-body-md px-md py-sm rounded-DEFAULT mb-md"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>

      <form method="post" class="flex flex-col gap-md">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars(store_csrf_token('admin_login'), ENT_QUOTES, 'UTF-8') ?>">
        <div>
          <label class="block font-mono-label text-mono-label text-on-surface-variant mb-xs">Heslo</label>
          <input type="password" name="password" placeholder="Zadejte heslo" required autofocus class="w-full bg-surface border border-outline-variant text-on-surface font-body-md px-md py-sm rounded-DEFAULT focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50">
        </div>
        <button type="submit" class="w-full bg-primary-container text-on-primary-container font-mono-label text-mono-label py-sm px-md rounded-DEFAULT border border-on-primary-container uppercase tracking-wider transition-all duration-200 shadow-[4px_4px_0px_0px_#10b981] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#10b981] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
          Přihlásit se
        </button>
      </form>
    </div>
  </div>
</main>

</body></html>
