<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pw2-drop">
    <span class="dz-ico"><?= icon_svg('FileText', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_to_word.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('pdf_to_word.drop_hint', $lang)) ?></span>
  </div>
  <div class="progress-track hidden" id="pw2-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pw2-prog-label"></p>
  <div class="hidden" id="pw2-work" style="margin-top:0.75rem">
    <p class="muted" id="pw2-info" style="font-size:0.85rem"></p>
    <button class="btn btn-primary btn-touch" id="pw2-run" type="button"><?= icon_svg('Download', 18) ?> <?= e(vv_t('pdf_to_word.download_btn', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="pw2-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('pdf_to_word.note', $lang)) ?></p>
</div>