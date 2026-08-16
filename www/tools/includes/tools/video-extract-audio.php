<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="va-drop">
    <span class="dz-ico"><?= icon_svg('Music', 28) ?></span>
    <span class="dz-title">Přetáhněte video</span>
    <span class="dz-hint">Vytáhne zvukovou stopu (ffmpeg.wasm)</span>
  </div>
  <div class="file-list hidden" id="va-list"></div>
  <div class="hidden" id="va-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="va-format">Formát audia</label>
        <select class="select" id="va-format"><option value="mp3" selected>MP3</option><option value="wav">WAV</option><option value="ogg">OGG</option><option value="flac">FLAC</option></select></div>
      <div class="stack-sm"><label class="field-label" for="va-br">Bitrate (ztrátové)</label><input class="input" id="va-br" type="number" value="192" min="64" max="320" style="width:6rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="va-run" type="button" disabled><?= icon_svg('Music', 18) ?> Extrahovat audio</button>
  </div>
  <div class="progress-track hidden" id="va-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="va-prog-label"></p>
  <p class="error-text hidden" id="va-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Extrakce přes ffmpeg.wasm (-vn, jen zvuk). Limit ~100 MB. Běží lokálně.</p>
</div>