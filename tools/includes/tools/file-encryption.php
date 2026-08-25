<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="fe-mode" role="tablist">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true"><?= e(vv_t('file_encryption.encrypt', $lang)) ?></button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false"><?= e(vv_t('file_encryption.decrypt', $lang)) ?></button>
  </div>
  <div class="dropzone" id="fe-drop">
    <span class="dz-ico"><?= icon_svg('FileKey', 28) ?></span>
    <span class="dz-title" id="fe-drop-title"><?= e(vv_t('file_encryption.drop_title_enc', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('file_encryption.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="fe-list"></div>
  <div class="stack-sm">
    <label class="field-label" for="fe-pass"><?= e(vv_t('file_encryption.password', $lang)) ?></label>
    <input class="input" id="fe-pass" type="password" placeholder="<?= e(vv_t('file_encryption.password_ph', $lang)) ?>" autocomplete="new-password">
  </div>
  <button class="btn btn-primary btn-touch" id="fe-run" type="button" disabled><?= icon_svg('Shield', 18) ?> <span id="fe-run-label"><?= e(vv_t('file_encryption.run_enc', $lang)) ?></span></button>
  <div class="progress-track hidden" id="fe-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="fe-prog-label"></p>
  <p class="error-text hidden" id="fe-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('file_encryption.footer', $lang)) ?></p>
</div>