<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ci-principal">Počáteční vklad (Kč)</label>
      <input class="input" type="number" id="ci-principal" min="0" step="100" value="10000" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ci-pmt">Měsíční vklad (Kč)</label>
      <input class="input" type="number" id="ci-pmt" min="0" step="100" value="1000" inputmode="decimal">
    </div>
  </div>
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ci-rate">Úroková sazba p.a. (%)</label>
      <input class="input" type="number" id="ci-rate" min="0" step="0.01" value="6" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ci-years">Doba (roky)</label>
      <input class="input" type="number" id="ci-years" min="1" max="80" step="1" value="10" inputmode="numeric">
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ci-freq">Frekvence kapitalizace</label>
    <select class="select" id="ci-freq">
      <option value="1">Ročně</option>
      <option value="2">Půletálně</option>
      <option value="4">Čtvrtletně</option>
      <option value="12" selected>Měsíčně</option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Celkem vloženo</span><span class="v" id="ci-invested">—</span></div>
    <div class="kv"><span class="k">Zisk</span><span class="v accent" id="ci-gain">—</span></div>
    <div class="kv"><span class="k">Hodnota nakonec</span><span class="v" id="ci-total">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem">Modelový výpočet složeného úročení (nezohledňuje daň z úroků ani inflaci). Výpočet běží živě v prohlížeči.</p>
</div>