<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="mm-drop">
    <span class="dz-ico"><?= icon_svg('Laugh', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('meme_generator.drop_title', $lang)) ?></span>
    <span class="dz-hint">PNG, JPG, WebP</span>
  </div>
  <div class="hidden" id="mm-work">
    <div class="stack-sm">
      <label class="field-label" for="mm-top"><?= e(vv_t('meme_generator.top_text', $lang)) ?></label>
      <input class="input" id="mm-top" type="text" placeholder="<?= e(vv_t('meme_generator.top_placeholder', $lang)) ?>">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="mm-bottom"><?= e(vv_t('meme_generator.bottom_text', $lang)) ?></label>
      <input class="input" id="mm-bottom" type="text" placeholder="<?= e(vv_t('meme_generator.bottom_placeholder', $lang)) ?>">
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="mm-size"><?= e(vv_t('meme_generator.text_size', $lang)) ?></label><input type="range" id="mm-size" min="3" max="15" value="7" style="width:12rem"></div>
      <div class="stack-sm"><label class="field-label" for="mm-format"><?= e(vv_t('meme_generator.format', $lang)) ?></label>
        <select class="select" id="mm-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></div>
    </div>
    <canvas id="mm-canvas" style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem"></canvas>
    <button class="btn btn-primary" id="mm-dl" type="button" disabled style="margin-top:0.75rem"><?= icon_svg('Download', 16) ?> <?= e(vv_t('meme_generator.download', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="mm-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('meme_generator.note', $lang)) ?></p>
</div>