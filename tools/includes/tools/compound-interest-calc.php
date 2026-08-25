<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ci-principal"><?= e(vv_t('compound_interest_calc.principal', $lang)) ?></label>
      <input class="input" type="number" id="ci-principal" min="0" step="100" value="10000" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ci-pmt"><?= e(vv_t('compound_interest_calc.monthly', $lang)) ?></label>
      <input class="input" type="number" id="ci-pmt" min="0" step="100" value="1000" inputmode="decimal">
    </div>
  </div>
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ci-rate"><?= e(vv_t('compound_interest_calc.rate', $lang)) ?></label>
      <input class="input" type="number" id="ci-rate" min="0" step="0.01" value="6" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ci-years"><?= e(vv_t('compound_interest_calc.years', $lang)) ?></label>
      <input class="input" type="number" id="ci-years" min="1" max="80" step="1" value="10" inputmode="numeric">
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ci-freq"><?= e(vv_t('compound_interest_calc.freq', $lang)) ?></label>
    <select class="select" id="ci-freq">
      <option value="1"><?= e(vv_t('compound_interest_calc.freq_yearly', $lang)) ?></option>
      <option value="2"><?= e(vv_t('compound_interest_calc.freq_semiannual', $lang)) ?></option>
      <option value="4"><?= e(vv_t('compound_interest_calc.freq_quarterly', $lang)) ?></option>
      <option value="12" selected><?= e(vv_t('compound_interest_calc.freq_monthly', $lang)) ?></option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('compound_interest_calc.invested', $lang)) ?></span><span class="v" id="ci-invested">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('compound_interest_calc.gain', $lang)) ?></span><span class="v accent" id="ci-gain">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('compound_interest_calc.final_value', $lang)) ?></span><span class="v" id="ci-total">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('compound_interest_calc.footer', $lang)) ?></p>
</div>