<?php
// VZOR i18n šablony nástroje — všechny UI řetězce přes vv_t('pdf_merge.*', $lang).
// $lang, vv_t(), e(), icon_svg() jsou v scope (tools.php require).
// Mechanický vzor pro zbytek 103 šablon v includes/tools/*.php:
//   1) inline český text se nahradí vv_t() voláním (e() escapuje výstup)
//   2) ikony zůstávají raw (icon_svg je trusted SVG path)
//   3) klíče do tools/lang/{cs,en,de,es,uk,fr,sk}.php pod prefixem <slug>.*
//      (pdf-merge používá pdf_merge.* protože slovník vznikl dříve; nové šablony
//       preferuj pojmenování <slug>.<klic> konzistentně s tool.* stylem.)
?>
<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="dropzone" id="pm-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_merge.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('pdf_merge.drop_hint', $lang)) ?></span>
    <span class="dz-accept"><?= e(vv_t('pdf_merge.drop_accept', $lang)) ?></span>
  </div>

  <div class="file-list hidden" id="pm-list" aria-label="<?= e(vv_t('pdf_merge.list_aria', $lang)) ?>"></div>

  <div class="row" style="flex-wrap:wrap">
    <button class="btn btn-primary btn-touch" id="pm-run" type="button" disabled><?= icon_svg('Files', 18) ?> <?= e(vv_t('pdf_merge.run', $lang)) ?></button>
    <button class="btn btn-ghost" id="pm-clear" type="button" disabled><?= icon_svg('Trash', 16) ?> <?= e(vv_t('pdf_merge.clear', $lang)) ?></button>
  </div>

  <div class="progress-track hidden" id="pm-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pm-prog-label"></p>
  <p class="error-text hidden" id="pm-error" role="alert"></p>

  <div class="result-card hidden" id="pm-result">
    <span class="rc-ico"><?= icon_svg('FileText', 24) ?></span>
    <div class="rc-meta">
      <span class="rc-title" id="pm-result-name"><?= e(vv_t('pdf_merge.result_name', $lang)) ?></span>
      <span class="rc-sub" id="pm-result-sub"></span>
    </div>
    <button class="btn btn-primary" id="pm-download" type="button"><?= icon_svg('Download', 16) ?> <?= e(vv_t('pdf_merge.download', $lang)) ?></button>
  </div>

  <div class="privacy-note"><?= icon_svg('ShieldCheck', 16) ?> <?= e(vv_t('pdf_merge.privacy', $lang)) ?></div>
</div>