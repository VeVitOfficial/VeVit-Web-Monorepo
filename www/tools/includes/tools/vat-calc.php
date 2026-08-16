<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="vat-mode" role="tablist" aria-label="Směr výpočtu DPH">
    <button type="button" class="active" data-mode="add" role="tab" aria-selected="true">Přidat DPH (bez → s)</button>
    <button type="button" data-mode="rem" role="tab" aria-selected="false">Odebrat DPH (s → bez)</button>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="vat-amount">Částka (Kč)</label>
    <input class="input" type="number" id="vat-amount" min="0" step="1" value="1000" inputmode="decimal">
  </div>

  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="vat-rate">Sazba DPH</label>
      <select class="select" id="vat-rate">
        <option value="21">21 % — základní</option>
        <option value="12">12 % — snížená</option>
        <option value="0">0 %</option>
        <option value="custom">vlastní…</option>
      </select>
    </div>
    <div class="stack-sm hidden" id="vat-custom-wrap">
      <label class="field-label" for="vat-custom">Vlastní sazba (%)</label>
      <input class="input" type="number" id="vat-custom" min="0" max="100" step="0.1" value="21" inputmode="decimal">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Bez DPH</span><span class="v" id="vat-net">—</span></div>
    <div class="kv"><span class="k">DPH</span><span class="v accent" id="vat-vat">—</span></div>
    <div class="kv"><span class="k">S DPH</span><span class="v" id="vat-gross">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem">Orientační výpočet. Aktuální sazby DPH v ČR ověřte u svého daňového poradce. Výpočet běží živě v prohlížeči.</p>
</div>