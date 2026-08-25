<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="po-drop">
    <span class="dz-ico"><?= icon_svg('Maximize', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_organize.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('tool_common.click_choose', $lang)) ?></span>
  </div>
  <div class="hidden" id="po-work">
    <p class="muted" style="font-size:0.85rem"><?= e(vv_t('pdf_organize.hint', $lang)) ?></p>
    <div class="file-list" id="po-list"></div>
    <button class="btn btn-primary btn-touch" id="po-run" type="button" disabled><?= icon_svg('Download', 18) ?> <?= e(vv_t('pdf_organize.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="po-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="po-prog-label"></p>
  <p class="error-text hidden" id="po-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('pdf_organize.footer', $lang)) ?></p>
</div>