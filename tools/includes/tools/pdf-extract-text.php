<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pe-drop">
    <span class="dz-ico"><?= icon_svg('AlignLeft', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_extract_text.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('pdf_extract_text.drop_hint', $lang)) ?></span>
  </div>
  <div class="hidden" id="pe-work">
    <div class="progress-track hidden" id="pe-prog"><div class="progress-fill"></div></div>
    <p class="progress-label hidden" id="pe-prog-label"></p>
    <div class="stack-sm" style="margin-top:0.75rem">
      <label class="field-label" for="pe-out"><?= e(vv_t('pdf_extract_text.out_label', $lang)) ?></label>
      <textarea class="textarea" id="pe-out" rows="14" readonly placeholder="<?= e(vv_t('pdf_extract_text.out_ph', $lang)) ?>"></textarea>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
      <button class="btn btn-secondary" id="pe-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
      <button class="btn btn-primary" id="pe-dl" type="button" disabled><?= icon_svg('Download', 16) ?> <?= e(vv_t('pdf_extract_text.download', $lang)) ?></button>
    </div>
  </div>
  <p class="error-text hidden" id="pe-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('pdf_extract_text.footer', $lang)) ?></p>
</div>