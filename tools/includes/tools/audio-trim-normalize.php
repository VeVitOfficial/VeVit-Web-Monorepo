<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="atn-drop">
    <span class="dz-ico"><?= icon_svg('SlidersHorizontal', 28) ?></span>
    <span class="dz-title">Přetáhněte audio</span>
    <span class="dz-hint">Ořez + normalizace hlasitosti (ffmpeg.wasm)</span>
  </div>
  <div class="file-list hidden" id="atn-list"></div>
  <div class="hidden" id="atn-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="atn-start">Začátek (HH:MM:SS)</label><input class="input" id="atn-start" type="text" value="00:00:00" placeholder="00:00:00" style="width:7rem"></div>
      <div class="stack-sm"><label class="field-label" for="atn-end">Konec (HH:MM:SS)</label><input class="input" id="atn-end" type="text" value="00:00:30" placeholder="00:00:30" style="width:7rem"></div>
      <div class="stack-sm"><label class="field-label" for="atn-format">Výstup</label>
        <select class="select" id="atn-format"><option value="mp3" selected>MP3</option><option value="wav">WAV</option><option value="ogg">OGG</option></select></div>
    </div>
    <label class="row" style="gap:0.5rem;align-items:center;font-size:0.9rem"><input type="checkbox" id="atn-norm" checked> Normalizovat hlasitost (loudnorm)</label>
    <button class="btn btn-primary btn-touch" id="atn-run" type="button" disabled><?= icon_svg('SlidersHorizontal', 18) ?> Oříznout a normalizovat</button>
  </div>
  <div class="progress-track hidden" id="atn-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="atn-prog-label"></p>
  <p class="error-text hidden" id="atn-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Ořez (-ss/-to) + volitelná normalizace (loudnorm). Limit ~100 MB. Běží lokálně.</p>
</div>