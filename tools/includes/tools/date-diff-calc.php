<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="dd-from"><?= e(vv_t('date_diff_calc.from', $lang)) ?></label>
      <input class="input" type="date" id="dd-from">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="dd-to"><?= e(vv_t('date_diff_calc.to', $lang)) ?></label>
      <input class="input" type="date" id="dd-to">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('date_diff_calc.diff', $lang)) ?></span><span class="v accent" id="dd-days">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('date_diff_calc.in_weeks', $lang)) ?></span><span class="v" id="dd-weeks">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('date_diff_calc.in_months', $lang)) ?></span><span class="v" id="dd-months">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('date_diff_calc.in_years', $lang)) ?></span><span class="v" id="dd-years">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('date_diff_calc.in_hours', $lang)) ?></span><span class="v" id="dd-hours">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('date_diff_calc.note', $lang)) ?></p>
</div>