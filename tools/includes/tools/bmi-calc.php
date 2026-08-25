<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="bmi-weight"><?= e(vv_t('bmi_calc.weight', $lang)) ?></label>
      <input class="input" type="number" id="bmi-weight" min="20" max="400" step="0.1" value="70" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="bmi-height"><?= e(vv_t('bmi_calc.height', $lang)) ?></label>
      <input class="input" type="number" id="bmi-height" min="80" max="250" step="0.5" value="175" inputmode="decimal">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">BMI</span><span class="v accent" id="bmi-val">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('bmi_calc.category', $lang)) ?></span><span class="v" id="bmi-cat">—</span></div>
    <div class="kv hidden" id="bmi-ideal-row"><span class="k"><?= e(vv_t('bmi_calc.ideal_weight', $lang)) ?></span><span class="v" id="bmi-ideal">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('bmi_calc.footer', $lang)) ?></p>
</div>