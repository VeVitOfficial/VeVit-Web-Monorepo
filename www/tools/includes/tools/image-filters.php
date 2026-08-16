<div class="stack" style="max-width:50rem;margin:0 auto">
  <div class="dropzone" id="if-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title">Přetáhněte obrázek</span>
    <span class="dz-hint">PNG, JPG, WebP, GIF, BMP</span>
  </div>
  <div class="hidden" id="if-work">
    <img id="if-preview" style="max-width:100%;border-radius:0.5rem;margin-bottom:1rem" alt="">
    <div class="two-col" style="gap:1rem">
      <div class="stack-sm">
        <label class="field-label">Jas: <span id="if-b-v">100</span> %</label>
        <input type="range" id="if-b" min="0" max="200" value="100" style="width:100%">
        <label class="field-label">Kontrast: <span id="if-c-v">100</span> %</label>
        <input type="range" id="if-c" min="0" max="200" value="100" style="width:100%">
        <label class="field-label">Saturace: <span id="if-s-v">100</span> %</label>
        <input type="range" id="if-s" min="0" max="200" value="100" style="width:100%">
      </div>
      <div class="stack-sm">
        <label class="field-label">Odstín: <span id="if-h-v">0</span>°</label>
        <input type="range" id="if-h" min="0" max="360" value="0" style="width:100%">
        <label class="field-label">Rozostření: <span id="if-bl-v">0</span> px</label>
        <input type="range" id="if-bl" min="0" max="20" value="0" style="width:100%">
        <label class="field-label">Invert: <span id="if-i-v">0</span> %</label>
        <input type="range" id="if-i" min="0" max="100" value="0" style="width:100%">
      </div>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
      <button class="btn btn-ghost" type="button" data-tog="grayscale">Odstíny šedi</button>
      <button class="btn btn-ghost" type="button" data-tog="sepia">Sepia</button>
      <button class="btn btn-ghost" type="button" id="if-reset">Reset</button>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem;align-items:end">
      <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.85rem">Formát:
        <select class="select" id="if-format"><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option></select></label>
      <button class="btn btn-primary" id="if-dl" type="button" disabled><?= icon_svg('Download', 16) ?> Stáhnout</button>
    </div>
  </div>
  <p class="error-text hidden" id="if-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Filtry přes canvas (ctx.filter). Běží lokálně, živý náhled.</p>
</div>