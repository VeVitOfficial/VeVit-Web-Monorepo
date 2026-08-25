<div class="stack" style="max-width:36rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local"><?= e(vv_t('tool_common.local', $lang)) ?></span>
  </div>

  <div class="row" style="gap:0.75rem">
    <input class="input input-mono" id="nb-value" value="255" placeholder="<?= e(vv_t('number_base_converter.ph', $lang)) ?>" style="font-size:1.125rem;background:rgba(19,19,22,0.5)">
    <select class="select" id="nb-from">
      <option value="2"><?= e(vv_t('number_base_converter.radix_bin', $lang)) ?></option>
      <option value="8"><?= e(vv_t('number_base_converter.radix_oct', $lang)) ?></option>
      <option value="10" selected><?= e(vv_t('number_base_converter.radix_dec', $lang)) ?></option>
      <option value="16"><?= e(vv_t('number_base_converter.radix_hex', $lang)) ?></option>
    </select>
  </div>

  <div class="stack-sm" id="nb-rows">
    <div class="nb-row">
      <span class="label"><?= e(vv_t('number_base_converter.radix_bin', $lang)) ?></span>
      <input class="input input-mono nb-out" data-radix="2" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="2" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
    <div class="nb-row">
      <span class="label"><?= e(vv_t('number_base_converter.radix_oct', $lang)) ?></span>
      <input class="input input-mono nb-out" data-radix="8" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="8" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
    <div class="nb-row">
      <span class="label"><?= e(vv_t('number_base_converter.radix_dec', $lang)) ?></span>
      <input class="input input-mono nb-out" data-radix="10" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="10" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
    <div class="nb-row">
      <span class="label"><?= e(vv_t('number_base_converter.radix_hex', $lang)) ?></span>
      <input class="input input-mono nb-out" data-radix="16" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="16" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
  </div>
</div>