<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="up-drop">
    <span class="dz-ico"><?= icon_svg('Maximize', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('img_upscaler.drop_title', $lang)) ?></span>
    <span class="dz-hint">PNG, JPG, WebP</span>
  </div>
  <div class="hidden" id="up-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="up-scale"><?= e(vv_t('img_upscaler.scale', $lang)) ?></label>
        <select class="select" id="up-scale"><option value="2">2×</option><option value="3">3×</option><option value="4">4×</option></select></div>
      <div class="stack-sm"><label class="field-label" for="up-format"><?= e(vv_t('img_upscaler.format', $lang)) ?></label>
        <select class="select" id="up-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></div>
      <button class="btn btn-primary" id="up-run" type="button"><?= icon_svg('Maximize', 16) ?> <?= e(vv_t('img_upscaler.upscale', $lang)) ?></button>
    </div>
    <div class="two-col" style="gap:1rem;margin-top:1rem;align-items:start">
      <div class="stack-sm"><span class="field-label"><?= e(vv_t('img_upscaler.original', $lang)) ?></span><img id="up-src" style="max-width:100%;border-radius:0.5rem" alt=""></div>
      <div class="stack-sm"><span class="field-label"><?= e(vv_t('tool_common.result', $lang)) ?></span><img id="up-dst" style="max-width:100%;border-radius:0.5rem" alt=""></div>
    </div>
    <p id="up-info" class="muted" style="font-size:0.85rem;margin-top:0.5rem"></p>
    <button class="btn btn-secondary" id="up-dl" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="up-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('img_upscaler.note', $lang)) ?></p>
</div>