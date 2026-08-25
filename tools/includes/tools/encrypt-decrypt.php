<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="ed-mode" role="tablist" aria-label="<?= e(vv_t('encrypt_decrypt.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true"><?= e(vv_t('encrypt_decrypt.encrypt', $lang)) ?></button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false"><?= e(vv_t('encrypt_decrypt.decrypt', $lang)) ?></button>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ed-input"><?= e(vv_t('encrypt_decrypt.text', $lang)) ?></label>
    <textarea class="textarea input-mono" id="ed-input" placeholder="<?= e(vv_t('encrypt_decrypt.text_ph', $lang)) ?>" style="min-height:9rem"></textarea>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ed-pass"><?= e(vv_t('encrypt_decrypt.password', $lang)) ?></label>
    <div class="row">
      <input class="input" type="password" id="ed-pass" placeholder="<?= e(vv_t('encrypt_decrypt.password_ph', $lang)) ?>" autocomplete="off" style="flex:1">
      <button class="btn btn-ghost btn-icon" type="button" id="ed-toggle" aria-label="<?= e(vv_t('encrypt_decrypt.show_pass_aria', $lang)) ?>"><?= icon_svg('Eye', 18) ?></button>
    </div>
  </div>

  <div class="row">
    <button class="btn btn-primary btn-touch" id="ed-run" type="button"><?= icon_svg('Shield', 18) ?> <span id="ed-run-label"><?= e(vv_t('encrypt_decrypt.run_enc', $lang)) ?></span></button>
    <button class="btn btn-ghost" id="ed-clear" type="button"><?= icon_svg('Trash', 16) ?> <?= e(vv_t('tool_common.clear', $lang)) ?></button>
  </div>

  <p class="error-text hidden" id="ed-error" role="alert"></p>

  <div class="stack-sm">
    <div class="row-between">
      <span class="muted" style="font-size:0.875rem;font-weight:500"><?= e(vv_t('encrypt_decrypt.output', $lang)) ?></span>
      <button class="btn btn-ghost btn-sm" id="ed-copy" disabled type="button">
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
        <span class="label"><?= e(vv_t('tool_common.copy', $lang)) ?></span>
      </button>
    </div>
    <textarea class="textarea input-mono" id="ed-output" readonly placeholder="<?= e(vv_t('encrypt_decrypt.output_ph', $lang)) ?>" style="min-height:9rem;background:rgba(19,19,22,0.3)"></textarea>
  </div>

  <div class="privacy-note"><?= icon_svg('ShieldCheck', 16) ?> <?= e(vv_t('encrypt_decrypt.privacy', $lang)) ?></div>
</div>