<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vco-drop">
    <span class="dz-ico"><?= icon_svg('Shrink', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('video_compress.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('video_compress.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="vco-list"></div>
  <div class="hidden" id="vco-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="vco-res"><?= e(vv_t('video_compress.resolution', $lang)) ?></label>
        <select class="select" id="vco-res"><option value="" selected><?= e(vv_t('video_compress.res_original', $lang)) ?></option><option value="1280:-2">720p</option><option value="854:-2">480p</option><option value="640:-2">360p</option></select></div>
      <div class="stack-sm"><label class="field-label" for="vco-crf"><?= e(vv_t('video_compress.quality', $lang)) ?></label><input class="input" id="vco-crf" type="number" value="28" min="18" max="40" style="width:6rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="vco-run" type="button" disabled><?= icon_svg('Shrink', 18) ?> <?= e(vv_t('video_compress.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="vco-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vco-prog-label"></p>
  <p class="error-text hidden" id="vco-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('video_compress.footer', $lang)) ?></p>
</div>