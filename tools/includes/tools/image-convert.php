<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="ic-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('image_convert.drop_title', $lang)) ?></span>
    <span class="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
  </div>
  <div class="hidden" id="ic-work">
    <div class="two-col" style="gap:1rem;align-items:start">
      <div class="stack-sm"><span class="field-label"><?= e(vv_t('image_convert.input', $lang)) ?></span><img id="ic-src" style="max-width:100%;border-radius:0.5rem;background:#0001" alt=""></div>
      <div class="stack-sm"><span class="field-label"><?= e(vv_t('image_convert.output', $lang)) ?></span><img id="ic-dst" style="max-width:100%;border-radius:0.5rem;background:#0001" alt=""></div>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end;margin-top:1rem">
      <div class="stack-sm"><label class="field-label" for="ic-format"><?= e(vv_t('image_convert.format', $lang)) ?></label>
        <select class="select" id="ic-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/bmp">BMP</option></select></div>
      <div class="stack-sm" id="ic-q-wrap"><label class="field-label" for="ic-q"><?= e(vv_t('image_convert.quality', $lang)) ?> <span id="ic-q-v">90</span> %</label>
        <input type="range" id="ic-q" min="10" max="100" value="90" style="width:12rem"></div>
      <button class="btn btn-primary" id="ic-conv" type="button"><?= icon_svg('Repeat', 16) ?> <?= e(vv_t('image_convert.convert', $lang)) ?></button>
      <button class="btn btn-secondary" id="ic-dl" type="button" disabled><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
    </div>
    <p id="ic-info" class="muted" style="font-size:0.8rem;margin-top:0.5rem"></p>
  </div>
  <p class="error-text hidden" id="ic-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('image_convert.note', $lang)) ?></p>
</div>