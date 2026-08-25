<?php
// Sdílený footer. Očekává načtené i18n-bootstrap + registry (vv_t).
if (!function_exists('vv_tools_lang')) {
    require_once __DIR__ . '/i18n-bootstrap.php';
    require_once __DIR__ . '/registry.php';
}
require_once __DIR__ . '/icons.php';
$lang = vv_tools_lang();
?>
<footer class="site-footer">
  <div class="bar">
    <a href="/<?= $lang ?>/home" class="hover-fg">
      <?= icon_svg('ArrowLeft', 16) ?> <?= e(vv_t('footer.back')) ?>
    </a>
    <span class="privacy">
      <?= icon_svg('ShieldCheck', 16) ?> <?= e(vv_t('footer.privacy')) ?>
    </span>
    <p><?= e(vv_t('footer.copyright')) ?></p>
  </div>
</footer>
<script src="/tools/assets/js/lib/toast.js"></script>
<script src="/tools/assets/js/lib/icons.js"></script>
<script src="/tools/assets/js/lib/tool-ui.js"></script>
<script src="/tools/assets/js/site.js"></script>
</body>
</html>