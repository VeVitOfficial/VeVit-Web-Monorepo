<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="seg" id="cj-mode" role="tablist" aria-label="Směr převodu">
    <button type="button" class="active" data-mode="c2j" role="tab" aria-selected="true">CSV → JSON</button>
    <button type="button" data-mode="j2c" role="tab" aria-selected="false">JSON → CSV</button>
  </div>
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="cj-in">Vstup</label>
      <textarea class="textarea mono" id="cj-in" rows="12" spellcheck="false" placeholder="Vložte CSV nebo JSON…"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cj-out">Výstup</label>
      <textarea class="textarea mono" id="cj-out" rows="12" readonly spellcheck="false" placeholder="Výstup se zobrazí zde…"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm" style="flex:1;min-width:10rem">
      <label class="field-label" for="cj-delim">Oddělovač (CSV)</label>
      <select class="select" id="cj-delim">
        <option value=",">čárka (,)</option>
        <option value=";">středník (;)</option>
        <option value="&#9;">tabulátor</option>
      </select>
    </div>
    <button class="btn btn-primary" id="cj-run" type="button"><?= icon_svg('FileSpreadsheet', 16) ?> Převést</button>
    <button class="btn btn-secondary" id="cj-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
    <button class="btn btn-ghost" id="cj-swap" type="button">⇅ Prohodit</button>
  </div>
  <p class="error-text hidden" id="cj-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Bez knihoven — vlastní parser/emiter respektující uvozovky a víceřádková pole. Běží lokálně.</p>
</div>