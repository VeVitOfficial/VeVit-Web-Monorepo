<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vg-drop">
    <span class="dz-ico"><?= icon_svg('Film', 28) ?></span>
    <span class="dz-title">Přetáhněte video</span>
    <span class="dz-hint">Vytvoří animované GIF (ffmpeg.wasm)</span>
  </div>
  <div class="file-list hidden" id="vg-list"></div>
  <div class="hidden" id="vg-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="vg-dur">Délka (s, 0 = celé)</label><input class="input" id="vg-dur" type="number" value="10" min="0" max="60" style="width:5rem"></div>
      <div class="stack-sm"><label class="field-label" for="vg-fps">Snímky/s</label><input class="input" id="vg-fps" type="number" value="10" min="5" max="24" style="width:5rem"></div>
      <div class="stack-sm"><label class="field-label" for="vg-width">Šířka (px)</label><input class="input" id="vg-width" type="number" value="480" min="120" max="1280" step="2" style="width:6rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="vg-run" type="button" disabled><?= icon_svg('Film', 18) ?> Vytvořit GIF</button>
  </div>
  <div class="progress-track hidden" id="vg-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vg-prog-label"></p>
  <p class="error-text hidden" id="vg-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">GIF přes ffmpeg.wasm (palettegen + paletteuse pro lepší kvalitu). Limit ~100 MB. Běží lokálně.</p>
</div>