<div class="stack" style="max-width:56rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="seg" id="fj-lang" role="tablist" aria-label="Jazyk">
      <button type="button" class="active" data-lang="css" role="tab" aria-selected="true">CSS</button>
      <button type="button" data-lang="html" role="tab" aria-selected="false">HTML</button>
      <button type="button" data-lang="js" role="tab" aria-selected="false">JS</button>
    </div>
    <div class="seg" id="fj-act" role="tablist" aria-label="Akce">
      <button type="button" class="active" data-act="beautify" role="tab" aria-selected="true">Formátovat</button>
      <button type="button" data-act="minify" role="tab" aria-selected="false">Zminifikovat</button>
    </div>
    <div class="stack-sm" style="flex:0 0 auto">
      <label class="field-label" for="fj-indent">Odsazení</label>
      <select class="select" id="fj-indent"><option value="2">2 mezery</option><option value="4">4 mezery</option></select>
    </div>
  </div>
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="fj-in">Vstup</label>
      <textarea class="textarea mono" id="fj-in" rows="14" spellcheck="false" placeholder="Vložte kód…"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="fj-out">Výstup</label>
      <textarea class="textarea mono" id="fj-out" rows="14" readonly spellcheck="false"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="fj-run" type="button"><?= icon_svg('SquareCode', 16) ?> Spustit</button>
    <button class="btn btn-secondary" id="fj-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
  </div>
  <p class="error-text hidden" id="fj-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Formátování přes js-beautify (lazy-load). Minifikace CSS/HTML je regexová; minifikace JS je konzervativní (bez komentářů, kolaps mezer) — pro produkci použijte terser/esbuild.</p>
</div>