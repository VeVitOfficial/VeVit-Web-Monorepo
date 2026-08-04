<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pr-drop">
    <span class="dz-ico"><?= icon_svg('RotateCw', 28) ?></span>
    <span class="dz-title">Přetáhněte PDF soubor</span>
    <span class="dz-hint">nebo klikněte pro výběr</span>
  </div>
  <div class="hidden" id="pr-work">
    <div class="stack-sm">
      <label class="field-label" for="pr-angle">Otočení (°)</label>
      <select class="select" id="pr-angle">
        <option value="90">90° vpravo</option>
        <option value="180">180°</option>
        <option value="270">90° vlevo (270°)</option>
      </select>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="pr-pages">Rozsah stran (prázdné = všechny)</label>
      <input class="input" id="pr-pages" type="text" placeholder="např. 1-3, 5">
    </div>
    <button class="btn btn-primary btn-touch" id="pr-run" type="button" disabled><?= icon_svg('RotateCw', 18) ?> Otočit a stáhnout</button>
  </div>
  <div class="progress-track hidden" id="pr-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pr-prog-label"></p>
  <p class="error-text hidden" id="pr-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Otočení přes pdf-lib. Běží lokálně — soubor neopustí prohlížeč.</p>
</div>