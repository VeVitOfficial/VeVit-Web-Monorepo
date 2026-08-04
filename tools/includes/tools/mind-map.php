<div class="stack" style="max-width:64rem;margin:0 auto">
  <p class="muted" style="font-size:0.8rem">Pište odsazený seznam (2 mezery nebo Tab na úroveň). Každý řádek = uzel. Náhled se kreslí živě jako radiální strom.</p>
  <div class="two-col" style="gap:1rem;align-items:start">
    <div class="stack-sm">
      <label class="field-label" for="mm-in">Struktura (odsazený text)</label>
      <textarea class="textarea mono" id="mm-in" rows="16" spellcheck="false">Projekt
  Analýza
    Požadavky
    Konkurence
  Vývoj
    Backend
    Frontend
    Testování
  Deployment
    Staging
    Produkce</textarea>
    </div>
    <div class="stack-sm">
      <span class="field-label">Náhled</span>
      <div id="mm-svg-wrap" style="border-radius:0.75rem;overflow:auto;max-height:32rem"></div>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-secondary" id="mm-svg-dl" type="button"><?= icon_svg('Download', 16) ?> Stáhnout SVG</button>
    <button class="btn btn-ghost" id="mm-sample" type="button">Vzor</button>
  </div>
  <p class="muted" style="font-size:0.8rem">Vizualizace běží lokálně (SVG). Strukturu zadáváte textem — nic se neodesílá.</p>
</div>