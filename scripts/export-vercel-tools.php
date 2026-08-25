#!/usr/bin/env php
<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/tools/includes/registry.php';

$root = dirname(__DIR__);
$destination = $root . '/generated/vercel';
$locales = ['cs', 'en', 'de', 'es', 'uk', 'fr', 'sk'];

function render_php_page(string $file, array $query, string $locale): string
{
    $bootstrap = '$_GET=' . var_export($query, true) . ';'
        . '$_SERVER["REQUEST_METHOD"]="GET";'
        . '$_SERVER["REQUEST_URI"]=' . var_export('/' . $locale . '/tools/', true) . ';'
        . 'putenv(' . var_export('VEVIT_LANG=' . $locale, true) . ');'
        . 'include ' . var_export($file, true) . ';';
    $command = escapeshellarg(PHP_BINARY) . ' -d display_errors=0 -r ' . escapeshellarg($bootstrap);
    $output = shell_exec($command);
    if (!is_string($output) || trim($output) === '') {
        throw new RuntimeException('Empty export from ' . basename($file));
    }
    return $output;
}

function write_export(string $path, string $html): void
{
    $directory = dirname($path);
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException('Cannot create ' . $directory);
    }
    $html = str_replace(
        ['Nedostupné na WEDOS', 'unavailable_on_wedos'],
        ['Vyžaduje serverovou integraci', 'requires_external_service'],
        $html
    );
    if (file_put_contents($path, $html, LOCK_EX) === false) {
        throw new RuntimeException('Cannot write ' . $path);
    }
}

foreach ($locales as $locale) {
    $landing = render_php_page($root . '/tools/index.php', [], $locale);
    write_export($destination . '/' . $locale . '/tools/index.html', $landing);
    foreach (all_tools() as $tool) {
        $html = render_php_page($root . '/tools/tools.php', ['slug' => $tool['slug']], $locale);
        write_export($destination . '/' . $locale . '/tools/' . $tool['slug'] . '.html', $html);
    }
}

write_export($destination . '/tools/index.html', render_php_page($root . '/tools/index.php', [], 'cs'));
foreach (all_tools() as $tool) {
    write_export(
        $destination . '/tools/' . $tool['slug'] . '.html',
        render_php_page($root . '/tools/tools.php', ['slug' => $tool['slug']], 'cs')
    );
}

fwrite(STDOUT, "Exported " . count(all_tools()) . " tools for " . count($locales) . " locales.\n");
