<div class="stack" style="max-width:50rem;margin:0 auto">
  <div class="dropzone" id="cr-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('image_crop.drop_title', $lang)) ?></span>
    <span class="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
  </div>
  <div class="hidden" id="cr-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end;margin-bottom:0.75rem">
      <div class="stack-sm"><label class="field-label" for="cr-ratio"><?= e(vv_t('image_crop.ratio', $lang)) ?></label>
        <select class="select" id="cr-ratio"><option value="0"><?= e(vv_t('image_crop.ratio_free', $lang)) ?></option><option value="1">1:1</option><option value="1.333">4:3</option><option value="1.778">16:9</option><option value="1.5">3:2</option></select></div>
      <button class="btn btn-ghost" id="cr-clear" type="button"><?= e(vv_t('image_crop.clear_sel', $lang)) ?></button>
    </div>
    <canvas id="cr-canvas" style="max-width:100%;touch-action:none;border-radius:0.5rem;cursor:crosshair;background:#0001"></canvas>
    <p class="muted" id="cr-coords" style="font-size:0.8rem;margin-top:0.5rem"><?= e(vv_t('image_crop.hint', $lang)) ?></p>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;align-items:end">
      <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.85rem"><?= e(vv_t('image_crop.format', $lang)) ?>
        <select class="select" id="cr-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
      <button class="btn btn-primary" id="cr-apply" type="button" disabled><?= icon_svg('Crop', 16) ?> <?= e(vv_t('image_crop.apply', $lang)) ?></button>
    </div>
  </div>
  <p class="error-text hidden" id="cr-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('image_crop.footer', $lang)) ?></p>
</div>