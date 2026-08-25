<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="fc-mode" role="tablist" aria-label="<?= e(vv_t('fuel_consumption_calc.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="l" role="tab" aria-selected="true">l/100 km → mpg</button>
    <button type="button" data-mode="mpg" role="tab" aria-selected="false">mpg → l/100 km</button>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="fc-in" id="fc-in-label"><?= e(vv_t('fuel_consumption_calc.input_label', $lang)) ?></label>
    <input class="input" type="number" id="fc-in" min="0" step="0.1" value="7.5" inputmode="decimal">
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k" id="fc-out-k">mpg (US)</span><span class="v accent" id="fc-out">—</span></div>
    <div class="kv hidden" id="fc-out2-row"><span class="k" id="fc-out2-k">mpg (UK)</span><span class="v" id="fc-out2">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('fuel_consumption_calc.footer', $lang)) ?></p>
</div>