<?php
declare(strict_types=1);

$accountHelper = file_get_contents(__DIR__ . '/../account/lib/auth-helpers.php');
$homeHelper = file_get_contents(__DIR__ . '/../home/lib/vevit-auth.php');
if (!is_string($accountHelper) || !is_string($homeHelper)) throw new RuntimeException('Auth loadery nelze načíst.');

foreach (['VEVIT_ACCOUNT_CONFIG_PATH', '/etc/vevit/account.php', "dirname(__DIR__, 3) . '/vevit-private/account.php'"] as $needle) {
    if (!str_contains($accountHelper, $needle)) throw new RuntimeException('Account loader postrádá: ' . $needle);
}
if (str_contains($accountHelper, "__DIR__ . '/../config.php'")) throw new RuntimeException('Account stále používá config ve webrootu.');
foreach (['VEVIT_HOME_CONFIG_PATH', '/etc/vevit/home.php', "dirname(__DIR__, 3) . '/vevit-private/home.php'"] as $needle) {
    if (!str_contains($homeHelper, $needle)) throw new RuntimeException('Home loader postrádá: ' . $needle);
}
if (str_contains($homeHelper, "../api/config.php")) throw new RuntimeException('Home stále používá config ve webrootu.');

fwrite(STDOUT, "external-config-test: PASS\n");
