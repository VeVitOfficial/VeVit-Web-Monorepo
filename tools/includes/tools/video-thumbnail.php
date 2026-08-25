<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vt-drop">
    <span class="dz-ico"><?= icon_svg('Camera', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('video_thumbnail.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('video_thumbnail.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="vt-list"></div>
  <div class="hidden" id="vt-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="vt-time"><?= e(vv_t('video_thumbnail.time', $lang)) ?></label><input class="input" id="vt-time" type="number" value="1" min="0" step="0.1" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="vt-format"><?= e(vv_t('video_thumbnail.format', $lang)) ?></label>
        <select class="select" id="vt-format"><option value="image/png">PNG</option><option value="image/jpeg" selected>JPEG</option><option value="image/webp">WebP</option></select></div>
    </div>
    <video id="vt-video" controls style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem" hidden></video>
    <canvas id="vt-canvas" style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem"></canvas>
    <button class="btn btn-primary" id="vt-dl" type="button" disabled style="margin-top:0.75rem"><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="vt-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('video_thumbnail.footer', $lang)) ?></p>
</div>