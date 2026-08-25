<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="dc-price"><?= e(vv_t('discount_calc.price', $lang)) ?></label>
    <input class="input" type="number" id="dc-price" min="0" step="1" value="1000" inputmode="decimal">
  </div>

  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="dc-d1"><?= e(vv_t('discount_calc.discount1', $lang)) ?></label>
      <input class="input" type="number" id="dc-d1" min="0" max="100" step="1" value="20" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="dc-d2"><?= e(vv_t('discount_calc.discount2', $lang)) ?></label>
      <input class="input" type="number" id="dc-d2" min="0" max="100" step="1" value="0" inputmode="decimal">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('discount_calc.final_price', $lang)) ?></span><span class="v accent" id="dc-final">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('discount_calc.saved', $lang)) ?></span><span class="v" id="dc-saved">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('discount_calc.total_discount', $lang)) ?></span><span class="v" id="dc-total">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('discount_calc.footer', $lang)) ?></p>
</div>