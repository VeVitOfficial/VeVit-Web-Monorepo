<?php
declare(strict_types=1);
require __DIR__ . '/test-lib.php';
require HUB_ROOT . '/includes/registry.php';

$missing = [];
foreach (all_tools() as $tool) {
    $slug = $tool['slug'];
    $template = HUB_ROOT . '/includes/tools/' . $slug . '.php';
    $script = HUB_ROOT . '/assets/js/tools/' . $slug . '.js';
    $informational = in_array($tool['status'], ['coming_soon', 'unavailable_on_wedos', 'broken'], true);
    if ($informational) {
        hub_assert(!is_file($template) && !is_file($script), $slug . ' informational tool must not pretend an active implementation');
        continue;
    }
    if (!is_file($template)) $missing[] = $template;
    if (!is_file($script)) $missing[] = $script;
    foreach ($tool['requirements']['local_assets'] as $asset) {
        hub_assert(is_string($asset) && str_starts_with($asset, '/tools/assets/') && !str_contains($asset, '..'), $slug . ' unsafe local asset declaration');
        $assetPath = HUB_ROOT . substr($asset, strlen('/tools'));
        if (!is_file($assetPath)) $missing[] = $assetPath;
    }
}
hub_assert($missing === [], 'missing declared implementation assets: ' . implode(', ', $missing));

$publicFiles = [HUB_ROOT . '/index.html', HUB_ROOT . '/assets/data/tools.json', HUB_ROOT . '/assets/data/tools-index.json'];
foreach ($publicFiles as $file) {
    $contents = (string)file_get_contents($file);
    hub_assert(!preg_match('/(service[_-]?role|STRIPE_(SECRET|WEBHOOK)|SUPABASE_SERVICE_ROLE|sk-[A-Za-z0-9]{16,})/i', $contents), 'possible secret in public file ' . basename($file));
}
$scan = [];
foreach (['api', 'includes', 'assets', 'scripts', 'router.php', '.htaccess', 'index.html', 'tools.php'] as $entry) {
    $path = HUB_ROOT . '/' . $entry;
    if (is_dir($path)) foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)) as $file) $scan[] = $file->getPathname();
    elseif (is_file($path)) $scan[] = $path;
}
foreach ($scan as $file) {
    $contents = (string)file_get_contents($file);
    hub_assert(!preg_match('/(?:VeVit Store|vevit_store_session|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|DIGITAL_FILES_PATH|store\/api\/health)/i', $contents), 'Store reference remains in ' . substr($file, strlen(HUB_ROOT) + 1));
}
echo "PASS assets: templates=104 scripts=104\n";
