<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vc-drop">
    <span class="dz-ico"><?= icon_svg('Video', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('video_convert.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('video_convert.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="vc-list"></div>
  <div class="hidden" id="vc-work">
    <div class="stack-sm"><label class="field-label" for="vc-format"><?= e(vv_t('video_convert.target_format', $lang)) ?></label>
      <select class="select" id="vc-format"><option value="mp4">MP4 (H.264/AAC)</option><option value="webm">WebM (VP8/Vorbis)</option></select></div>
    <button class="btn btn-primary btn-touch" id="vc-run" type="button" disabled><?= icon_svg('Video', 18) ?> <?= e(vv_t('video_convert.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="vc-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vc-prog-label"></p>
  <p class="error-text hidden" id="vc-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('video_convert.footer', $lang)) ?></p>
</div>