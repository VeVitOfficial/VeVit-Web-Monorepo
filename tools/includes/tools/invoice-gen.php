<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <span class="field-label"><?= e(vv_t('invoice_gen.supplier', $lang)) ?></span>
      <input class="input" id="iv-sup-name" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_company', $lang)) ?>" value="Jan Novák — Živnost">
      <textarea class="textarea" id="iv-sup-addr" rows="2" placeholder="<?= e(vv_t('invoice_gen.ph_addr', $lang)) ?>">Dlouhá 1\n110 00 Praha</textarea>
      <input class="input" id="iv-sup-ico" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_ico', $lang)) ?>" value="12345678">
      <input class="input" id="iv-sup-dic" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_dic', $lang)) ?>" value="CZ12345678">
    </div>
    <div class="stack-sm">
      <span class="field-label"><?= e(vv_t('invoice_gen.customer', $lang)) ?></span>
      <input class="input" id="iv-cus-name" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_customer_name', $lang)) ?>">
      <textarea class="textarea" id="iv-cus-addr" rows="2" placeholder="<?= e(vv_t('invoice_gen.ph_addr', $lang)) ?>"></textarea>
      <input class="input" id="iv-cus-ico" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_ico', $lang)) ?>">
    </div>
  </div>

  <div class="two-col" style="margin-top:1rem">
    <div class="stack-sm">
      <span class="field-label"><?= e(vv_t('invoice_gen.invoice_data', $lang)) ?></span>
      <div class="row" style="flex-wrap:wrap;gap:0.5rem">
        <input class="input" id="iv-num" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_num', $lang)) ?>" value="2026001" style="flex:1;min-width:8rem">
        <input class="input" id="iv-date" type="date">
      </div>
      <div class="row" style="flex-wrap:wrap;gap:0.5rem">
        <input class="input" id="iv-tax" type="date" placeholder="<?= e(vv_t('invoice_gen.ph_tax_date', $lang)) ?>" style="flex:1;min-width:8rem">
        <input class="input" id="iv-due" type="date" placeholder="<?= e(vv_t('invoice_gen.ph_due', $lang)) ?>">
      </div>
    </div>
    <div class="stack-sm">
      <span class="field-label"><?= e(vv_t('invoice_gen.payment', $lang)) ?></span>
      <input class="input" id="iv-iban" type="text" placeholder="IBAN" value="CZ0708000000001234567">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem">
        <input class="input" id="iv-vs" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_vs', $lang)) ?>" value="2026001" style="flex:1;min-width:8rem">
        <input class="input" id="iv-ks" type="text" placeholder="<?= e(vv_t('invoice_gen.ph_ks', $lang)) ?>" style="flex:1;min-width:6rem">
      </div>
    </div>
  </div>

  <div class="stack-sm" style="margin-top:1rem">
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;align-items:end">
      <div class="stack-sm" style="flex:1;min-width:10rem"><label class="field-label" for="iv-vat"><?= e(vv_t('invoice_gen.vat', $lang)) ?></label><input class="input" id="iv-vat" type="number" value="21" min="0" max="100" style="width:6rem"></div>
      <button class="btn btn-secondary" id="iv-add-row" type="button"><?= icon_svg('Plus', 16) ?> <?= e(vv_t('invoice_gen.add_item', $lang)) ?></button>
    </div>
    <div id="iv-rows" class="stack-sm"></div>
  </div>

  <div class="row" style="flex-wrap:wrap;gap:0.75rem;margin-top:1rem;align-items:center">
    <button class="btn btn-primary btn-touch" id="iv-run" type="button"><?= icon_svg('Receipt', 18) ?> <?= e(vv_t('invoice_gen.run', $lang)) ?></button>
    <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" id="iv-qr" checked> <?= e(vv_t('invoice_gen.qr', $lang)) ?></label>
  </div>

  <div class="progress-track hidden" id="iv-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="iv-prog-label"></p>
  <p class="error-text hidden" id="iv-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('invoice_gen.footer', $lang)) ?></p>
</div>