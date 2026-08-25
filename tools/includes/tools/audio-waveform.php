<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="aw-drop">
    <span class="dz-ico"><?= icon_svg('Volume2', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('audio_waveform.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('audio_waveform.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="aw-list"></div>
  <div class="hidden" id="aw-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="aw-color"><?= e(vv_t('audio_waveform.color', $lang)) ?></label><input type="color" id="aw-color" value="#22d3ee" style="width:4rem;height:2.4rem;padding:0.2rem"></div>
      <div class="stack-sm"><label class="field-label" for="aw-bg"><?= e(vv_t('audio_waveform.background', $lang)) ?></label><input type="color" id="aw-bg" value="#0b1220" style="width:4rem;height:2.4rem;padding:0.2rem"></div>
      <div class="stack-sm"><label class="field-label" for="aw-bars"><?= e(vv_t('audio_waveform.bars', $lang)) ?></label><input class="input" id="aw-bars" type="number" value="200" min="20" max="1000" style="width:6rem"></div>
    </div>
    <canvas id="aw-canvas" style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem"></canvas>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
      <button class="btn btn-secondary" id="aw-png" type="button" disabled><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?> PNG</button>
      <button class="btn btn-secondary" id="aw-svg" type="button" disabled><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?> SVG</button>
    </div>
  </div>
  <div class="progress-track hidden" id="aw-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="aw-prog-label"></p>
  <p class="error-text hidden" id="aw-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('audio_waveform.footer', $lang)) ?></p>
</div>