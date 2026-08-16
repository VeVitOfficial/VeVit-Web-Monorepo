<div class="stack" style="max-width:54rem;margin:0 auto">
  <div class="stack-sm">
    <span class="field-label">Vyberte pole (klik = přidat/odebrat sloupec)</span>
    <div id="fd-fields" class="row" style="flex-wrap:wrap;gap:0.5rem"></div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="fd-count">Počet řádků</label><input class="input" id="fd-count" type="number" value="10" min="1" max="2000"></div>
    <div class="stack-sm"><label class="field-label" for="fd-format">Formát</label><select class="select" id="fd-format"><option value="json">JSON</option><option value="csv">CSV</option></select></div>
    <button class="btn btn-primary" id="fd-gen" type="button"><?= icon_svg('Database', 16) ?> Generovat</button>
    <button class="btn btn-secondary" id="fd-dl" type="button" disabled><?= icon_svg('Download', 16) ?> Stáhnout</button>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="fd-out">Výstup</label>
    <textarea class="textarea mono" id="fd-out" rows="14" readonly></textarea>
  </div>
  <p class="muted" style="font-size:0.8rem">Data se generují lokálně (Math.random / crypto). Jsou fiktivní — nepoužívejte pro reálné osoby.</p>
</div>