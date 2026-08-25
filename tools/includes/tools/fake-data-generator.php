<div class="stack" style="max-width:54rem;margin:0 auto">
  <div class="stack-sm">
    <span class="field-label"><?= e(vv_t('fake_data_generator.fields_hint', $lang)) ?></span>
    <div id="fd-fields" class="row" style="flex-wrap:wrap;gap:0.5rem"></div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="fd-count"><?= e(vv_t('fake_data_generator.rows', $lang)) ?></label><input class="input" id="fd-count" type="number" value="10" min="1" max="2000"></div>
    <div class="stack-sm"><label class="field-label" for="fd-format"><?= e(vv_t('fake_data_generator.format', $lang)) ?></label><select class="select" id="fd-format"><option value="json">JSON</option><option value="csv">CSV</option></select></div>
    <button class="btn btn-primary" id="fd-gen" type="button"><?= icon_svg('Database', 16) ?> <?= e(vv_t('tool_common.generate', $lang)) ?></button>
    <button class="btn btn-secondary" id="fd-dl" type="button" disabled><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="fd-out"><?= e(vv_t('fake_data_generator.output', $lang)) ?></label>
    <textarea class="textarea mono" id="fd-out" rows="14" readonly></textarea>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('fake_data_generator.footer', $lang)) ?></p>
</div>