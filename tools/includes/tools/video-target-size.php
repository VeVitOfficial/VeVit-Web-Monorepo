<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vts-drop">
    <span class="dz-ico"><?= icon_svg('Scale', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('video_target_size.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('video_target_size.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="vts-list"></div>
  <div class="hidden" id="vts-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="vts-mb"><?= e(vv_t('video_target_size.target_size', $lang)) ?></label><input class="input" id="vts-mb" type="number" value="25" min="1" max="500" step="0.5" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="vts-dur"><?= e(vv_t('video_target_size.duration', $lang)) ?></label><input class="input" id="vts-dur" type="number" min="0" step="0.1" style="width:6rem" placeholder="<?= e(vv_t('video_target_size.auto_placeholder', $lang)) ?>" readonly></div>
    </div>
    <button class="btn btn-primary btn-touch" id="vts-run" type="button" disabled><?= icon_svg('Scale', 18) ?> <?= e(vv_t('video_target_size.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="vts-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vts-prog-label"></p>
  <p class="error-text hidden" id="vts-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('video_target_size.note', $lang)) ?></p>
</div>