<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="sg-mode" role="tablist">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true"><?= e(vv_t('steganography.mode_enc', $lang)) ?></button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false"><?= e(vv_t('steganography.mode_dec', $lang)) ?></button>
  </div>
  <div class="dropzone" id="sg-drop">
    <span class="dz-ico"><?= icon_svg('EyeOff', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('steganography.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('steganography.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="sg-list"></div>
  <div class="hidden" id="sg-enc-grp">
    <div class="stack-sm">
      <label class="field-label" for="sg-text"><?= e(vv_t('steganography.message', $lang)) ?></label>
      <textarea class="textarea" id="sg-text" rows="4" placeholder="<?= e(vv_t('steganography.ph', $lang)) ?>"></textarea>
    </div>
    <button class="btn btn-primary btn-touch" id="sg-enc" type="button" disabled><?= icon_svg('Download', 18) ?> <?= e(vv_t('steganography.enc_run', $lang)) ?></button>
  </div>
  <div class="hidden" id="sg-dec-grp">
    <button class="btn btn-primary btn-touch" id="sg-dec" type="button" disabled><?= icon_svg('Eye', 18) ?> <?= e(vv_t('steganography.dec_run', $lang)) ?></button>
    <div class="stack-sm" style="margin-top:0.75rem">
      <label class="field-label"><?= e(vv_t('steganography.out_label', $lang)) ?></label>
      <textarea class="textarea" id="sg-out" rows="4" readonly placeholder="<?= e(vv_t('steganography.out_ph', $lang)) ?>"></textarea>
    </div>
  </div>
  <div class="progress-track hidden" id="sg-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="sg-prog-label"></p>
  <p class="error-text hidden" id="sg-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('steganography.footer', $lang)) ?></p>
</div>