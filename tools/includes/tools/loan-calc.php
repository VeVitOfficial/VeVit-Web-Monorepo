<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ln-amount"><?= e(vv_t('loan_calc.amount', $lang)) ?></label>
      <input class="input" type="number" id="ln-amount" min="0" step="1000" value="500000" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ln-rate"><?= e(vv_t('loan_calc.rate', $lang)) ?></label>
      <input class="input" type="number" id="ln-rate" min="0" step="0.01" value="6.5" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ln-years"><?= e(vv_t('loan_calc.years', $lang)) ?></label>
      <input class="input" type="number" id="ln-years" min="1" max="40" step="1" value="20" inputmode="numeric">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ln-freq"><?= e(vv_t('loan_calc.freq', $lang)) ?></label>
      <select class="select" id="ln-freq">
        <option value="12"><?= e(vv_t('loan_calc.freq_monthly', $lang)) ?></option>
        <option value="4"><?= e(vv_t('loan_calc.freq_quarterly', $lang)) ?></option>
        <option value="2"><?= e(vv_t('loan_calc.freq_halfyearly', $lang)) ?></option>
        <option value="1"><?= e(vv_t('loan_calc.freq_yearly', $lang)) ?></option>
      </select>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ln-extra"><?= e(vv_t('loan_calc.extra', $lang)) ?></label>
      <input class="input" type="number" id="ln-extra" min="0" step="100" value="0" inputmode="decimal">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.25rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('loan_calc.payment', $lang)) ?></span><span class="v accent" id="ln-payment">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('loan_calc.total', $lang)) ?></span><span class="v" id="ln-total">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('loan_calc.interest', $lang)) ?></span><span class="v" id="ln-interest">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('loan_calc.count', $lang)) ?></span><span class="v" id="ln-count">—</span></div>
  </div>

  <div class="loan-chart" role="img" aria-labelledby="ln-chart-label"><div class="loan-chart-bar"><span id="ln-principal-bar"></span><span id="ln-interest-bar"></span></div><p id="ln-chart-label"><span><?= e(vv_t('loan_calc.principal_share', $lang)) ?> <strong id="ln-principal-pct">—</strong></span><span><?= e(vv_t('loan_calc.interest_share', $lang)) ?> <strong id="ln-interest-pct">—</strong></span></p></div>

  <details class="accordion">
    <summary><?= e(vv_t('loan_calc.amort', $lang)) ?> <span class="acc-chev"><?= icon_svg('ChevronDown', 16) ?></span></summary>
    <div class="acc-body">
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>#</th><th><?= e(vv_t('loan_calc.th_payment', $lang)) ?></th><th><?= e(vv_t('loan_calc.th_interest', $lang)) ?></th><th><?= e(vv_t('loan_calc.th_principal', $lang)) ?></th><th><?= e(vv_t('loan_calc.th_balance', $lang)) ?></th></tr></thead>
          <tbody id="ln-table"></tbody>
        </table>
      </div>
    </div>
  </details>

  <button class="btn btn-outline" id="ln-print" type="button"><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_ui.print', $lang)) ?></button>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('loan_calc.footer', $lang)) ?></p>
</div>
