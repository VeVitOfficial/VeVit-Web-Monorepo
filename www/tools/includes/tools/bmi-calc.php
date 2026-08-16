<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="bmi-weight">Váha (kg)</label>
      <input class="input" type="number" id="bmi-weight" min="20" max="400" step="0.1" value="70" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="bmi-height">Výška (cm)</label>
      <input class="input" type="number" id="bmi-height" min="80" max="250" step="0.5" value="175" inputmode="decimal">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">BMI</span><span class="v accent" id="bmi-val">—</span></div>
    <div class="kv"><span class="k">Kategorie</span><span class="v" id="bmi-cat">—</span></div>
    <div class="kv hidden" id="bmi-ideal-row"><span class="k">Ideální váha</span><span class="v" id="bmi-ideal">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem">Výpočet běží živě v prohlížeči. BMI je orientační ukazatel — nebere v úvahu svalovou hmotu ani stavbu těla.</p>
</div>