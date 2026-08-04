<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="aw-drop">
    <span class="dz-ico"><?= icon_svg('Volume2', 28) ?></span>
    <span class="dz-title">Přetáhněte audio</span>
    <span class="dz-hint">MP3, WAV, OGG, M4A — křivka přes Web Audio API</span>
  </div>
  <div class="file-list hidden" id="aw-list"></div>
  <div class="hidden" id="aw-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="aw-color">Barva</label><input type="color" id="aw-color" value="#22d3ee" style="width:4rem;height:2.4rem;padding:0.2rem"></div>
      <div class="stack-sm"><label class="field-label" for="aw-bg">Pozadí</label><input type="color" id="aw-bg" value="#0b1220" style="width:4rem;height:2.4rem;padding:0.2rem"></div>
      <div class="stack-sm"><label class="field-label" for="aw-bars">Sloupců</label><input class="input" id="aw-bars" type="number" value="200" min="20" max="1000" style="width:6rem"></div>
    </div>
    <canvas id="aw-canvas" style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem"></canvas>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
      <button class="btn btn-secondary" id="aw-png" type="button" disabled><?= icon_svg('Download', 16) ?> Stáhnout PNG</button>
      <button class="btn btn-secondary" id="aw-svg" type="button" disabled><?= icon_svg('Download', 16) ?> Stáhnout SVG</button>
    </div>
  </div>
  <div class="progress-track hidden" id="aw-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="aw-prog-label"></p>
  <p class="error-text hidden" id="aw-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Dekódování přes Web Audio API (AudioContext.decodeAudioData). Běží lokálně — audio neopustí prohlížeč.</p>
</div>