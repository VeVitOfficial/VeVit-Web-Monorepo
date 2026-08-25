<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="co-drop">
    <span class="dz-ico"><?= icon_svg('Image', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('img_compress.drop_title', $lang)) ?></span>
    <span class="dz-hint">PNG, JPG, WebP</span>
  </div>
  <div class="hidden" id="co-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="co-format"><?= e(vv_t('img_compress.format', $lang)) ?></label>
        <select class="select" id="co-format"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png"><?= e(vv_t('img_compress.format_png', $lang)) ?></option></select></div>
      <div class="stack-sm"><label class="field-label" for="co-q"><?= e(vv_t('img_compress.quality', $lang)) ?> <span id="co-q-v">75</span> %</label>
        <input type="range" id="co-q" min="10" max="100" value="75" style="width:12rem"></div>
      <div class="stack-sm"><label class="field-label" for="co-max"><?= e(vv_t('img_compress.max_size', $lang)) ?></label>
        <input class="input" id="co-max" type="number" value="0" min="0"></div>
    </div>
    <button class="btn btn-primary" id="co-run" type="button" style="margin-top:1rem"><?= icon_svg('Image', 16) ?> <?= e(vv_t('img_compress.compress_btn', $lang)) ?></button>
    <div class="two-col" style="gap:1rem;margin-top:1rem;align-items:start">
      <div class="stack-sm"><span class="field-label"><?= e(vv_t('img_compress.original', $lang)) ?></span><img id="co-src" style="max-width:100%;border-radius:0.5rem" alt=""></div>
      <div class="stack-sm"><span class="field-label"><?= e(vv_t('tool_common.result', $lang)) ?></span><img id="co-dst" style="max-width:100%;border-radius:0.5rem" alt=""></div>
    </div>
    <p id="co-info" class="muted" style="font-size:0.85rem;margin-top:0.5rem"></p>
    <button class="btn btn-secondary" id="co-dl" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="co-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('img_compress.note', $lang)) ?></p>
</div>