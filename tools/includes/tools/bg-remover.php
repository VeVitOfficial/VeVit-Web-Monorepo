<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="bg-drop">
    <span class="dz-ico"><?= icon_svg('Eraser', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('bg_remover.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('bg_remover.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="bg-list"></div>
  <div class="hidden" id="bg-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="bg-bg"><?= e(vv_t('bg_remover.bg_label', $lang)) ?></label>
        <select class="select" id="bg-bg"><option value="transparent" selected><?= e(vv_t('bg_remover.bg_transparent', $lang)) ?></option><option value="white"><?= e(vv_t('bg_remover.bg_white', $lang)) ?></option><option value="black"><?= e(vv_t('bg_remover.bg_black', $lang)) ?></option><option value="green"><?= e(vv_t('bg_remover.bg_green', $lang)) ?></option></select></div>
    </div>
    <button class="btn btn-primary btn-touch" id="bg-run" type="button" disabled><?= icon_svg('Eraser', 18) ?> <?= e(vv_t('bg_remover.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="bg-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="bg-prog-label"></p>
  <p class="error-text hidden" id="bg-error" role="alert"></p>
  <div class="hidden" id="bg-out" style="margin-top:1rem">
    <p class="field-label"><?= e(vv_t('tool_common.result', $lang)) ?></p>
    <div class="result-card" id="bg-card"></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('bg_remover.footer_pre', $lang)) ?><strong><?= e(vv_t('bg_remover.footer_strong', $lang)) ?></strong><?= e(vv_t('bg_remover.footer_post', $lang)) ?></p>
</div>