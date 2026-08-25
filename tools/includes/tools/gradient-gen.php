<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm" style="min-width:9rem">
      <label class="field-label" for="gg-type"><?= e(vv_t('gradient_gen.type', $lang)) ?></label>
      <select class="select" id="gg-type">
        <option value="linear"><?= e(vv_t('gradient_gen.type_linear', $lang)) ?></option>
        <option value="radial"><?= e(vv_t('gradient_gen.type_radial', $lang)) ?></option>
        <option value="conic"><?= e(vv_t('gradient_gen.type_conic', $lang)) ?></option>
      </select>
    </div>
    <div class="stack-sm" id="gg-angle-wrap">
      <label class="field-label" for="gg-angle"><?= e(vv_t('gradient_gen.angle', $lang)) ?> <span id="gg-angle-val" class="mono">90</span>°</label>
      <div class="range-row"><input type="range" id="gg-angle" min="0" max="360" step="1" value="90"><span class="range-val">0–360</span></div>
    </div>
  </div>

  <div class="stack-sm">
    <span class="field-label"><?= e(vv_t('gradient_gen.stops', $lang)) ?></span>
    <div id="gg-stops" class="stack-sm"></div>
    <button class="btn btn-ghost" id="gg-add-stop" type="button"><?= icon_svg('Plus', 16) ?> <?= e(vv_t('gradient_gen.add_stop', $lang)) ?></button>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:1rem">
    <div id="gg-preview" style="height:120px;border-radius:0.5rem;border:1px solid rgba(255,255,255,0.08)"></div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="gg-css">CSS</label>
    <textarea class="textarea mono" id="gg-css" readonly rows="2"></textarea>
    <button class="btn btn-secondary" id="gg-copy" type="button"><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
  </div>
</div>