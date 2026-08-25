<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="ic-drop">
    <span class="dz-ico"><?= icon_svg('Images', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('image_collage.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('image_collage.drop_hint', $lang)) ?></span>
  </div>
  <div class="hidden" id="ic-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="ic-layout"><?= e(vv_t('image_collage.layout', $lang)) ?></label>
        <select class="select" id="ic-layout">
          <option value="grid"><?= e(vv_t('image_collage.layout_grid', $lang)) ?></option>
          <option value="row"><?= e(vv_t('image_collage.layout_row', $lang)) ?></option>
          <option value="col"><?= e(vv_t('image_collage.layout_col', $lang)) ?></option>
          <option value="2x2">2×2</option>
          <option value="3x3">3×3</option>
          <option value="hero"><?= e(vv_t('image_collage.layout_hero', $lang)) ?></option>
        </select></div>
      <div class="stack-sm"><label class="field-label" for="ic-gap"><?= e(vv_t('image_collage.gap', $lang)) ?></label><input class="input" id="ic-gap" type="number" value="8" min="0" max="40" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="ic-bg"><?= e(vv_t('image_collage.background', $lang)) ?></label><input class="input" id="ic-bg" type="color" value="#ffffff" style="width:4rem;height:2.4rem;padding:0.2rem"></div>
      <div class="stack-sm"><label class="field-label" for="ic-format"><?= e(vv_t('image_collage.format', $lang)) ?></label>
        <select class="select" id="ic-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></div>
    </div>
    <div id="ic-list" class="file-list" style="margin-top:0.75rem"></div>
    <canvas id="ic-canvas" style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem"></canvas>
    <button class="btn btn-primary" id="ic-dl" type="button" disabled style="margin-top:0.75rem"><?= icon_svg('Download', 16) ?> <?= e(vv_t('image_collage.download_collage', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="ic-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('image_collage.note', $lang)) ?></p>
</div>