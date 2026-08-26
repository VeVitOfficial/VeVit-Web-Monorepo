<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vt2-drop">
    <span class="dz-ico"><?= icon_svg('Scissors', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('video_trim.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('video_trim.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="vt2-list"></div>
  <div class="hidden" id="vt2-work">
    <video class="media-preview" id="vt2-preview" controls preload="metadata"></video>
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="vt2-start"><?= e(vv_t('video_trim.start', $lang)) ?></label><input class="input" id="vt2-start" type="text" value="00:00:00" placeholder="00:00:05"></div>
      <div class="stack-sm"><label class="field-label" for="vt2-end"><?= e(vv_t('video_trim.end', $lang)) ?></label><input class="input" id="vt2-end" type="text" placeholder="00:00:30"></div>
      <div class="stack-sm"><label class="field-label" for="vt2-reenc"><?= e(vv_t('video_trim.reenc', $lang)) ?></label><select class="select" id="vt2-reenc"><option value="0" selected><?= e(vv_t('video_trim.reenc_copy', $lang)) ?></option><option value="1"><?= e(vv_t('video_trim.reenc_reenc', $lang)) ?></option></select></div>
    </div>
    <div class="media-range"><input id="vt2-start-range" type="range" min="0" value="0" step="0.1"><input id="vt2-end-range" type="range" min="0" value="0" step="0.1"><output id="vt2-summary">00:00:00 → 00:00:00</output></div>
    <div class="tool-action-bar"><button class="btn btn-secondary btn-touch hidden" id="vt2-cancel" type="button"><?= e(vv_t('tool_ui.cancel', $lang)) ?></button><button class="btn btn-primary btn-touch" id="vt2-run" type="button" disabled><?= icon_svg('Scissors', 18) ?> <?= e(vv_t('video_trim.run', $lang)) ?></button></div>
  </div>
  <div class="progress-track hidden" id="vt2-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vt2-prog-label"></p>
  <p class="error-text hidden" id="vt2-error" role="alert"></p>
  <video class="media-preview hidden" id="vt2-result-preview" controls></video>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('video_trim.footer', $lang)) ?></p>
</div>
