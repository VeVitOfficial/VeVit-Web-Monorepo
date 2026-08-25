<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vm-drop">
    <span class="dz-ico"><?= icon_svg('Plus', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('video_merge.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('video_merge.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="vm-list"></div>
  <div class="hidden" id="vm-work">
    <div class="stack-sm"><label class="field-label" for="vm-format"><?= e(vv_t('video_merge.output_format', $lang)) ?></label>
      <select class="select" id="vm-format"><option value="mp4" selected>MP4</option><option value="webm">WebM</option></select></div>
    <button class="btn btn-primary btn-touch" id="vm-run" type="button" disabled><?= icon_svg('Plus', 18) ?> <?= e(vv_t('video_merge.merge_btn', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="vm-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vm-prog-label"></p>
  <p class="error-text hidden" id="vm-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('video_merge.note', $lang)) ?></p>
</div>