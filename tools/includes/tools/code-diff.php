<div class="stack" style="max-width:64rem;margin:0 auto">
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="cd-left">Původní text</label>
      <textarea class="textarea mono" id="cd-left" rows="14" spellcheck="false" placeholder="Původní verze…"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cd-right">Upravený text</label>
      <textarea class="textarea mono" id="cd-right" rows="14" spellcheck="false" placeholder="Upravená verze…"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="cd-run" type="button"><?= icon_svg('GitCompare', 16) ?> Porovnat</button>
    <span class="muted" id="cd-stat" style="align-self:center;font-size:0.85rem"></span>
  </div>
  <div id="cd-out" class="glass" style="border-radius:0.75rem;overflow:auto;max-height:30rem"></div>
  <p class="muted" style="font-size:0.8rem">Porovnání po řádcích (jsdiff, lazy-load). Běží lokálně. Zelená = přidáno, červená = odebráno.</p>
</div>