<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="uc-cat" role="tablist" aria-label="<?= e(vv_t('unit_converter.categories_aria', $lang)) ?>">
    <button type="button" class="active" data-cat="length" role="tab" aria-selected="true"><?= e(vv_t('unit_converter.length', $lang)) ?></button>
    <button type="button" data-cat="mass" role="tab" aria-selected="false"><?= e(vv_t('unit_converter.mass', $lang)) ?></button>
    <button type="button" data-cat="temp" role="tab" aria-selected="false"><?= e(vv_t('unit_converter.temperature', $lang)) ?></button>
    <button type="button" data-cat="volume" role="tab" aria-selected="false"><?= e(vv_t('unit_converter.volume', $lang)) ?></button>
    <button type="button" data-cat="speed" role="tab" aria-selected="false"><?= e(vv_t('unit_converter.speed', $lang)) ?></button>
  </div>

  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="uc-value"><?= e(vv_t('unit_converter.value', $lang)) ?></label>
      <input class="input" type="number" id="uc-value" value="1" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="uc-from"><?= e(vv_t('unit_converter.from', $lang)) ?></label>
      <select class="select" id="uc-from"></select>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="uc-to"><?= e(vv_t('unit_converter.to', $lang)) ?></label>
      <select class="select" id="uc-to"></select>
    </div>
    <div class="stack-sm" style="justify-content:flex-end">
      <button class="btn btn-ghost btn-sm" id="uc-swap" type="button"><?= icon_svg('RefreshCw', 16) ?> <?= e(vv_t('unit_converter.swap', $lang)) ?></button>
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k" id="uc-result-k"><?= e(vv_t('tool_common.result', $lang)) ?></span><span class="v accent" id="uc-result">—</span></div>
  </div>
</div>