<?php
// Shared Tailwind config + head assets for VeVit Store
// Usage: include in <head>
$vvBase = defined('VEVIT_BASE') ? VEVIT_BASE : '';
?>
<link rel="stylesheet" href="/assets/css/vevit-tailwind.css">
<link rel="stylesheet" href="/assets/fonts/vevit-fonts.css">
<link rel="stylesheet" href="<?= $vvBase ?>assets/css/style.css">
<link rel="icon" href="<?= $vvBase ?>images/icon.ico" type="image/x-icon">
