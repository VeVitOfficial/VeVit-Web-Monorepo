<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ns-gross"><?= e(vv_t('net_salary_calc.gross', $lang)) ?></label>
      <input class="input" type="number" id="ns-gross" min="0" step="500" value="40000" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ns-children"><?= e(vv_t('net_salary_calc.children', $lang)) ?></label>
      <input class="input" type="number" id="ns-children" min="0" max="10" step="1" value="0" inputmode="numeric">
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ns-discount"><?= e(vv_t('net_salary_calc.discount', $lang)) ?></label>
    <select class="select" id="ns-discount">
      <option value="1" selected><?= e(vv_t('net_salary_calc.discount_yes', $lang)) ?></option>
      <option value="0"><?= e(vv_t('net_salary_calc.discount_no', $lang)) ?></option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('net_salary_calc.levy', $lang)) ?></span><span class="v" id="ns-levy">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('net_salary_calc.tax', $lang)) ?></span><span class="v" id="ns-tax">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('net_salary_calc.net', $lang)) ?></span><span class="v accent" id="ns-net">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('net_salary_calc.eff', $lang)) ?></span><span class="v" id="ns-eff">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('net_salary_calc.footer', $lang)) ?></p>
</div>