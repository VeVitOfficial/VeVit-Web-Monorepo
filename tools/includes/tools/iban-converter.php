<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="iban_mode" role="tablist" aria-label="<?= e(vv_t('iban_converter.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="to" role="tab" aria-selected="true"><?= e(vv_t('iban_converter.mode_to', $lang)) ?></button>
    <button type="button" data-mode="from" role="tab" aria-selected="false"><?= e(vv_t('iban_converter.mode_from', $lang)) ?></button>
  </div>

  <div class="stack-sm" id="iban-to">
    <label class="field-label" for="iban-acc"><?= e(vv_t('iban_converter.acc_label', $lang)) ?></label>
    <input class="input mono" type="text" id="iban-acc" placeholder="<?= e(vv_t('iban_converter.acc_ph', $lang)) ?>" autocomplete="off">
  </div>

  <div class="stack-sm hidden" id="iban-from">
    <label class="field-label" for="iban-iban"><?= e(vv_t('iban_converter.iban_label', $lang)) ?></label>
    <input class="input mono" type="text" id="iban-iban" placeholder="CZ..." autocomplete="off">
  </div>

  <div class="row" style="flex-wrap:wrap">
    <button class="btn btn-primary btn-touch" id="iban-run" type="button"><?= icon_svg('RefreshCw', 16) ?> <?= e(vv_t('iban_converter.convert', $lang)) ?></button>
    <button class="btn btn-ghost" id="iban-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k" id="iban-out-k">IBAN</span><span class="v accent mono" id="iban-out">—</span></div>
    <div class="kv hidden" id="iban-det-row"><span class="k"><?= e(vv_t('iban_converter.bank_code', $lang)) ?></span><span class="v mono" id="iban-det">—</span></div>
  </div>

  <p class="error-text hidden" id="iban-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('iban_converter.footer', $lang)) ?></p>
</div>