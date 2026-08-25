<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="rf-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('image_rotate_flip.drop_title', $lang)) ?></span>
    <span class="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
  </div>
  <div class="hidden" id="rf-work">
    <img id="rf-preview" style="max-width:100%;border-radius:0.5rem;margin-bottom:1rem" alt="">
    <div class="row" style="flex-wrap:wrap;gap:0.5rem">
      <button class="btn btn-secondary" type="button" data-op="rot90"><?= icon_svg('RotateCw', 16) ?> <?= e(vv_t('image_rotate_flip.rot90', $lang)) ?></button>
      <button class="btn btn-secondary" type="button" data-op="rot180"><?= e(vv_t('image_rotate_flip.rot180', $lang)) ?></button>
      <button class="btn btn-secondary" type="button" data-op="rot270"><?= e(vv_t('image_rotate_flip.rot270', $lang)) ?></button>
      <button class="btn btn-ghost" type="button" data-op="fliph"><?= e(vv_t('image_rotate_flip.fliph', $lang)) ?></button>
      <button class="btn btn-ghost" type="button" data-op="flipv"><?= e(vv_t('image_rotate_flip.flipv', $lang)) ?></button>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:1rem">
      <button class="btn btn-primary" id="rf-dl" type="button" disabled><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
      <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.85rem"><?= e(vv_t('image_rotate_flip.format', $lang)) ?>
        <select class="select" id="rf-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select>
      </label>
    </div>
  </div>
  <p class="error-text hidden" id="rf-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('image_rotate_flip.footer', $lang)) ?></p>
</div>