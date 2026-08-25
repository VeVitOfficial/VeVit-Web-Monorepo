<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="seg" id="yj-mode" role="tablist" aria-label="<?= e(vv_t('yaml_json_converter.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="y2j" role="tab" aria-selected="true"><?= e(vv_t('yaml_json_converter.mode_y2j', $lang)) ?></button>
    <button type="button" data-mode="j2y" role="tab" aria-selected="false"><?= e(vv_t('yaml_json_converter.mode_j2y', $lang)) ?></button>
  </div>
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="yj-in"><?= e(vv_t('yaml_json_converter.input', $lang)) ?></label>
      <textarea class="textarea mono" id="yj-in" rows="12" spellcheck="false" placeholder="<?= e(vv_t('yaml_json_converter.ph', $lang)) ?>"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="yj-out"><?= e(vv_t('yaml_json_converter.output', $lang)) ?></label>
      <textarea class="textarea mono" id="yj-out" rows="12" readonly spellcheck="false" placeholder="<?= e(vv_t('yaml_json_converter.out_ph', $lang)) ?>"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="yj-run" type="button"><?= icon_svg('FileCode', 16) ?> <?= e(vv_t('yaml_json_converter.run', $lang)) ?></button>
    <button class="btn btn-secondary" id="yj-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
    <button class="btn btn-ghost" id="yj-swap" type="button"><?= e(vv_t('yaml_json_converter.swap', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="yj-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('yaml_json_converter.footer', $lang)) ?></p>
</div>