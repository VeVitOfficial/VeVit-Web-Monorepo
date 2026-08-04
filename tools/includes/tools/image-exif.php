<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="ex-drop">
    <span class="dz-ico"><?= icon_svg('ScanLine', 28) ?></span>
    <span class="dz-title">Přetáhněte obrázek (JPEG doporučeno)</span>
    <span class="dz-hint">EXIF se nachází hlavně ve fotografiích JPEG</span>
  </div>
  <div class="hidden" id="ex-work">
    <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" id="ex-data">
      <p class="muted">Načítám metadata…</p>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.75rem">
      <button class="btn btn-secondary" id="ex-remove" type="button" disabled><?= icon_svg('Eraser', 16) ?> Odstranit metadata a stáhnout</button>
    </div>
  </div>
  <p class="error-text hidden" id="ex-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Čtení přes exifr (lazy-load). Odstranění = překódování přes canvas, čímž se vymažou všechna metadata. Běží lokálně — data neopustí prohlížeč.</p>
</div>