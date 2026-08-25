<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="wm-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('image_watermark.drop_title', $lang)) ?></span>
    <span class="dz-hint">PNG, JPG, WebP</span>
  </div>
  <div class="hidden" id="wm-work">
    <div class="seg" id="wm-mode" role="tablist" aria-label="<?= e(vv_t('image_watermark.mode_aria', $lang)) ?>">
      <button type="button" class="active" data-mode="text" role="tab" aria-selected="true"><?= e(vv_t('image_watermark.mode_text', $lang)) ?></button>
      <button type="button" data-mode="logo" role="tab" aria-selected="false"><?= e(vv_t('image_watermark.mode_logo', $lang)) ?></button>
    </div>
    <div id="wm-text-grp" class="stack-sm">
      <label class="field-label" for="wm-text"><?= e(vv_t('image_watermark.wm_text', $lang)) ?></label>
      <input class="input" id="wm-text" type="text" value="© 2026" placeholder="<?= e(vv_t('image_watermark.wm_ph', $lang)) ?>">
    </div>
    <div id="wm-logo-grp" class="hidden">
      <div class="dropzone" id="wm-logo-drop" style="padding:0.75rem">
        <span class="dz-title" style="font-size:0.9rem"><?= e(vv_t('image_watermark.logo_drop_title', $lang)) ?></span>
      </div>
    </div>
    <div class="two-col" style="gap:1rem;margin-top:0.75rem">
      <div class="stack-sm"><label class="field-label" for="wm-size"><?= e(vv_t('image_watermark.size', $lang)) ?></label><input type="range" id="wm-size" min="5" max="60" value="20" style="width:100%"></div>
      <div class="stack-sm"><label class="field-label" for="wm-op"><?= e(vv_t('image_watermark.opacity', $lang)) ?> <span id="wm-op-v">60</span> %</label><input type="range" id="wm-op" min="10" max="100" value="60" style="width:100%"></div>
    </div>
    <div id="wm-color-grp" class="stack-sm"><label class="field-label" for="wm-color"><?= e(vv_t('image_watermark.color', $lang)) ?></label><input type="color" id="wm-color" value="#ffffff" style="width:4rem;height:2rem"></div>
    <div class="stack-sm">
      <span class="field-label"><?= e(vv_t('image_watermark.pos', $lang)) ?></span>
      <div class="row" style="flex-wrap:wrap;gap:0.4rem" id="wm-pos">
        <button class="btn btn-ghost" type="button" data-pos="tl">↖</button>
        <button class="btn btn-ghost" type="button" data-pos="tc">↑</button>
        <button class="btn btn-ghost" type="button" data-pos="tr">↗</button>
        <button class="btn btn-ghost" type="button" data-pos="ml">←</button>
        <button class="btn btn-ghost" type="button" data-pos="mc">•</button>
        <button class="btn btn-ghost active" type="button" data-pos="mr">→</button>
        <button class="btn btn-ghost" type="button" data-pos="bl">↙</button>
        <button class="btn btn-ghost" type="button" data-pos="bc">↓</button>
        <button class="btn btn-ghost" type="button" data-pos="br">↘</button>
      </div>
    </div>
    <canvas id="wm-canvas" style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem"></canvas>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;align-items:end">
      <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.85rem"><?= e(vv_t('image_watermark.format', $lang)) ?>
        <select class="select" id="wm-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
      <button class="btn btn-primary" id="wm-dl" type="button" disabled><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
    </div>
  </div>
  <p class="error-text hidden" id="wm-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('image_watermark.footer', $lang)) ?></p>
</div>