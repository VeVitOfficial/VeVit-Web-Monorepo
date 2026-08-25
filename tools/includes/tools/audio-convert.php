<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="ac-drop">
    <span class="dz-ico"><?= icon_svg('Music', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('audio_convert.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('audio_convert.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="ac-list"></div>
  <div class="hidden" id="ac-work">
    <div class="stack-sm"><label class="field-label" for="ac-format"><?= e(vv_t('audio_convert.target_format', $lang)) ?></label>
      <select class="select" id="ac-format"><option value="mp3">MP3</option><option value="wav">WAV</option><option value="ogg">OGG (Vorbis)</option><option value="flac">FLAC</option></select></div>
    <div class="stack-sm hidden" id="ac-br-grp"><label class="field-label" for="ac-br"><?= e(vv_t('audio_convert.bitrate_label', $lang)) ?></label><input class="input" id="ac-br" type="number" value="192" min="64" max="320" style="width:6rem"></div>
    <button class="btn btn-primary btn-touch" id="ac-run" type="button" disabled><?= icon_svg('Music', 18) ?> <?= e(vv_t('audio_convert.convert_btn', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="ac-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="ac-prog-label"></p>
  <p class="error-text hidden" id="ac-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('audio_convert.note', $lang)) ?></p>
</div>