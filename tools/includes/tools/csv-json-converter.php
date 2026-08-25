<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="seg" id="cj-mode" role="tablist" aria-label="<?= e(vv_t('csv_json_converter.direction_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="c2j" role="tab" aria-selected="true">CSV → JSON</button>
    <button type="button" data-mode="j2c" role="tab" aria-selected="false">JSON → CSV</button>
  </div>
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="cj-in"><?= e(vv_t('csv_json_converter.input', $lang)) ?></label>
      <textarea class="textarea mono" id="cj-in" rows="12" spellcheck="false" placeholder="<?= e(vv_t('csv_json_converter.placeholder_input', $lang)) ?>"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cj-out"><?= e(vv_t('csv_json_converter.output', $lang)) ?></label>
      <textarea class="textarea mono" id="cj-out" rows="12" readonly spellcheck="false" placeholder="<?= e(vv_t('csv_json_converter.placeholder_output', $lang)) ?>"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm" style="flex:1;min-width:10rem">
      <label class="field-label" for="cj-delim"><?= e(vv_t('csv_json_converter.delimiter', $lang)) ?></label>
      <select class="select" id="cj-delim">
        <option value=","><?= e(vv_t('csv_json_converter.delim_comma', $lang)) ?></option>
        <option value=";"><?= e(vv_t('csv_json_converter.delim_semicolon', $lang)) ?></option>
        <option value="&#9;"><?= e(vv_t('csv_json_converter.delim_tab', $lang)) ?></option>
      </select>
    </div>
    <button class="btn btn-primary" id="cj-run" type="button"><?= icon_svg('FileSpreadsheet', 16) ?> <?= e(vv_t('csv_json_converter.convert_btn', $lang)) ?></button>
    <button class="btn btn-secondary" id="cj-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
    <button class="btn btn-ghost" id="cj-swap" type="button">⇅ <?= e(vv_t('csv_json_converter.swap', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="cj-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('csv_json_converter.note', $lang)) ?></p>
</div>