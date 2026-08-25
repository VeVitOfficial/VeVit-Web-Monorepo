<?php
declare(strict_types=1);

function platformAssert(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$root = dirname(__DIR__);
$composer = json_decode((string) file_get_contents($root . '/composer.json'), true, flags: JSON_THROW_ON_ERROR);
$lock = json_decode((string) file_get_contents($root . '/composer.lock'), true, flags: JSON_THROW_ON_ERROR);

platformAssert(
    ($composer['config']['platform']['php'] ?? null) === '8.3.32',
    'Composer must resolve dependencies for the WEDOS PHP 8.3.32 runtime'
);

$qrCode = null;
foreach ($lock['packages'] ?? [] as $package) {
    if (($package['name'] ?? null) === 'endroid/qr-code') {
        $qrCode = $package;
        break;
    }
}

platformAssert(is_array($qrCode), 'endroid/qr-code must be locked');
platformAssert(
    ($qrCode['require']['php'] ?? null) !== '^8.4',
    'Locked QR dependency must remain installable on PHP 8.3'
);

fwrite(STDOUT, "PASS Composer dependencies target WEDOS PHP 8.3.32\n");
