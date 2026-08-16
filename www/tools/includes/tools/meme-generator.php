<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="mm-drop">
    <span class="dz-ico"><?= icon_svg('Laugh', 28) ?></span>
    <span class="dz-title">Přetáhněte obrázek pro meme</span>
    <span class="dz-hint">PNG, JPG, WebP</span>
  </div>
  <div class="hidden" id="mm-work">
    <div class="stack-sm">
      <label class="field-label" for="mm-top">Horní text</label>
      <input class="input" id="mm-top" type="text" placeholder="ONE DOES NOT SIMPLY…">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="mm-bottom">Dolní text</label>
      <input class="input" id="mm-bottom" type="text" placeholder="…VYTVOŘIT MEME V PROHLÍŽEČI">
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="mm-size">Velikost textu (% šířky)</label><input type="range" id="mm-size" min="3" max="15" value="7" style="width:12rem"></div>
      <div class="stack-sm"><label class="field-label" for="mm-format">Formát</label>
        <select class="select" id="mm-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></div>
    </div>
    <canvas id="mm-canvas" style="max-width:100%;border-radius:0.5rem;margin-top:0.75rem"></canvas>
    <button class="btn btn-primary" id="mm-dl" type="button" disabled style="margin-top:0.75rem"><?= icon_svg('Download', 16) ?> Stáhnout meme</button>
  </div>
  <p class="error-text hidden" id="mm-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Klasický meme styl (Impact, bílý text s černým obrysem). Běží lokálně.</p>
</div>