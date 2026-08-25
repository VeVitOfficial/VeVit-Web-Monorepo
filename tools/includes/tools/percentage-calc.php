<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="pc-mode" role="tablist" aria-label="<?= e(vv_t('percentage_calc.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="of" role="tab" aria-selected="true"><?= e(vv_t('percentage_calc.mode_of', $lang)) ?></button>
    <button type="button" data-mode="pct" role="tab" aria-selected="false"><?= e(vv_t('percentage_calc.mode_pct', $lang)) ?></button>
    <button type="button" data-mode="delta" role="tab" aria-selected="false"><?= e(vv_t('percentage_calc.mode_delta', $lang)) ?></button>
  </div>

  <div class="stack-sm" id="pc-inputs">
    <div class="pc-group" data-for="of">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem 0.75rem;align-items:center">
        <span class="muted" style="font-size:0.875rem"><?= e(vv_t('percentage_calc.of_pre', $lang)) ?></span>
        <input class="input" type="number" id="pc-of-a" style="width:7rem" inputmode="decimal" placeholder="25">
        <span class="muted" style="font-size:0.875rem"><?= e(vv_t('percentage_calc.of_mid', $lang)) ?></span>
        <input class="input" type="number" id="pc-of-b" style="width:9rem" inputmode="decimal" placeholder="200">
        <span class="muted" style="font-size:0.875rem">?</span>
      </div>
    </div>
    <div class="pc-group hidden" data-for="pct">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem 0.75rem;align-items:center">
        <input class="input" type="number" id="pc-pct-a" style="width:7rem" inputmode="decimal" placeholder="50">
        <span class="muted" style="font-size:0.875rem"><?= e(vv_t('percentage_calc.pct_mid', $lang)) ?></span>
        <input class="input" type="number" id="pc-pct-b" style="width:9rem" inputmode="decimal" placeholder="200">
        <span class="muted" style="font-size:0.875rem">?</span>
      </div>
    </div>
    <div class="pc-group hidden" data-for="delta">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem 0.75rem;align-items:center">
        <span class="muted" style="font-size:0.875rem"><?= e(vv_t('percentage_calc.delta_from', $lang)) ?></span>
        <input class="input" type="number" id="pc-dl-from" style="width:7rem" inputmode="decimal" placeholder="100">
        <span class="muted" style="font-size:0.875rem"><?= e(vv_t('percentage_calc.delta_to', $lang)) ?></span>
        <input class="input" type="number" id="pc-dl-to" style="width:7rem" inputmode="decimal" placeholder="125">
      </div>
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('tool_common.result', $lang)) ?></span><span class="v accent" id="pc-result">—</span></div>
    <div class="kv hidden" id="pc-detail-row"><span class="k" id="pc-detail-k"><?= e(vv_t('percentage_calc.diff', $lang)) ?></span><span class="v" id="pc-detail-v">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('percentage_calc.footer', $lang)) ?></p>
</div>