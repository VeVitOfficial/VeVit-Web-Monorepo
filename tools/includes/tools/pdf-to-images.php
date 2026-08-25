<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pi-drop">
    <span class="dz-ico"><?= icon_svg('ImagePlus', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_to_images.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('pdf_to_images.drop_hint', $lang)) ?></span>
  </div>
  <div class="hidden" id="pi-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="pi-scale"><?= e(vv_t('pdf_to_images.scale', $lang)) ?></label>
        <select class="select" id="pi-scale"><option value="1">72 DPI</option><option value="1.5" selected>108 DPI</option><option value="2">144 DPI</option><option value="3">216 DPI</option></select></div>
      <div class="stack-sm"><label class="field-label" for="pi-format"><?= e(vv_t('pdf_to_images.format', $lang)) ?></label>
        <select class="select" id="pi-format"><option value="image/png" selected>PNG</option><option value="image/jpeg">JPEG</option></select></div>
      <div class="stack-sm hidden" id="pi-q-grp"><label class="field-label" for="pi-q"><?= e(vv_t('pdf_to_images.quality', $lang)) ?></label><input type="range" id="pi-q" min="0.5" max="0.95" step="0.01" value="0.82" style="width:10rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="pi-run" type="button" disabled><?= icon_svg('ImagePlus', 18) ?> <?= e(vv_t('pdf_to_images.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="pi-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pi-prog-label"></p>
  <p class="error-text hidden" id="pi-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('pdf_to_images.footer', $lang)) ?></p>
</div>