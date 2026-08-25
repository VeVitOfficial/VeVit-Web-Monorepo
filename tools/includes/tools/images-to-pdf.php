<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="ip-drop">
    <span class="dz-ico"><?= icon_svg('Files', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('images_to_pdf.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('images_to_pdf.drop_hint', $lang)) ?></span>
  </div>
  <div class="hidden" id="ip-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="ip-orient"><?= e(vv_t('images_to_pdf.orient', $lang)) ?></label>
        <select class="select" id="ip-orient"><option value="auto" selected><?= e(vv_t('images_to_pdf.orient_auto', $lang)) ?></option><option value="p"><?= e(vv_t('images_to_pdf.orient_portrait', $lang)) ?></option><option value="l"><?= e(vv_t('images_to_pdf.orient_landscape', $lang)) ?></option></select></div>
      <div class="stack-sm"><label class="field-label" for="ip-margin"><?= e(vv_t('images_to_pdf.margin', $lang)) ?></label><input class="input" id="ip-margin" type="number" value="0" min="0" max="72" style="width:6rem"></div>
      <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem;margin-bottom:0.35rem"><input type="checkbox" id="ip-fitA4" checked> <?= e(vv_t('images_to_pdf.fit_a4', $lang)) ?></label>
    </div>
    <div class="file-list" id="ip-list"></div>
    <button class="btn btn-primary btn-touch" id="ip-run" type="button" disabled><?= icon_svg('Files', 18) ?> <?= e(vv_t('images_to_pdf.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="ip-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="ip-prog-label"></p>
  <p class="error-text hidden" id="ip-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('images_to_pdf.footer', $lang)) ?></p>
</div>