<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="seg" id="b64-mode" role="tablist" aria-label="<?= e(vv_t('base64_tool.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true"><?= e(vv_t('base64_tool.mode_enc', $lang)) ?></button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false"><?= e(vv_t('base64_tool.mode_dec', $lang)) ?></button>
    <button type="button" data-mode="file" role="tab" aria-selected="false"><?= e(vv_t('base64_tool.mode_file', $lang)) ?></button>
  </div>

  <div id="b64-text">
    <div class="stack-sm">
      <label class="field-label" for="b64-in" id="b64-in-label"><?= e(vv_t('base64_tool.input_label', $lang)) ?></label>
      <textarea class="textarea mono" id="b64-in" rows="4" placeholder="<?= e(vv_t('base64_tool.input_placeholder', $lang)) ?>"></textarea>
    </div>
  </div>

  <div id="b64-file" class="hidden">
    <div class="dropzone" id="b64-drop">
      <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
      <span class="dz-title"><?= e(vv_t('base64_tool.drop_title', $lang)) ?></span>
      <span class="dz-hint"><?= e(vv_t('tool_common.click_choose', $lang)) ?></span>
      <span class="dz-accept"><?= e(vv_t('base64_tool.drop_accept', $lang)) ?></span>
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="b64-out"><?= e(vv_t('base64_tool.output', $lang)) ?></label>
    <textarea class="textarea mono" id="b64-out" rows="5" readonly placeholder="<?= e(vv_t('base64_tool.output_placeholder', $lang)) ?>"></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem">
      <button class="btn btn-secondary" id="b64-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
      <button class="btn btn-ghost" id="b64-clear" type="button"><?= e(vv_t('tool_common.clear', $lang)) ?></button>
    </div>
  </div>

  <p class="error-text hidden" id="b64-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('base64_tool.footer', $lang)) ?></p>
</div>