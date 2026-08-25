<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="vat-mode" role="tablist" aria-label="<?= e(vv_t('vat_calc.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="add" role="tab" aria-selected="true"><?= e(vv_t('vat_calc.mode_add', $lang)) ?></button>
    <button type="button" data-mode="rem" role="tab" aria-selected="false"><?= e(vv_t('vat_calc.mode_rem', $lang)) ?></button>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="vat-amount"><?= e(vv_t('vat_calc.amount', $lang)) ?></label>
    <input class="input" type="number" id="vat-amount" min="0" step="1" value="1000" inputmode="decimal">
  </div>

  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="vat-rate"><?= e(vv_t('vat_calc.rate', $lang)) ?></label>
      <select class="select" id="vat-rate">
        <option value="21"><?= e(vv_t('vat_calc.rate_21', $lang)) ?></option>
        <option value="12"><?= e(vv_t('vat_calc.rate_12', $lang)) ?></option>
        <option value="0"><?= e(vv_t('vat_calc.rate_0', $lang)) ?></option>
        <option value="custom"><?= e(vv_t('vat_calc.rate_custom', $lang)) ?></option>
      </select>
    </div>
    <div class="stack-sm hidden" id="vat-custom-wrap">
      <label class="field-label" for="vat-custom"><?= e(vv_t('vat_calc.custom_rate', $lang)) ?></label>
      <input class="input" type="number" id="vat-custom" min="0" max="100" step="0.1" value="21" inputmode="decimal">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('vat_calc.net', $lang)) ?></span><span class="v" id="vat-net">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('vat_calc.vat', $lang)) ?></span><span class="v accent" id="vat-vat">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('vat_calc.gross', $lang)) ?></span><span class="v" id="vat-gross">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('vat_calc.footer', $lang)) ?></p>
</div>