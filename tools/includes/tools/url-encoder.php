<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="seg" id="ue-mode" role="tablist" aria-label="<?= e(vv_t('url_encoder.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true"><?= e(vv_t('url_encoder.mode_enc', $lang)) ?></button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false"><?= e(vv_t('url_encoder.mode_dec', $lang)) ?></button>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ue-in"><?= e(vv_t('url_encoder.input', $lang)) ?></label>
    <textarea class="textarea mono" id="ue-in" rows="4" placeholder="<?= e(vv_t('url_encoder.ph', $lang)) ?>"></textarea>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ue-out"><?= e(vv_t('url_encoder.output', $lang)) ?></label>
    <textarea class="textarea mono" id="ue-out" rows="4" readonly placeholder="<?= e(vv_t('url_encoder.out_ph', $lang)) ?>"></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem">
      <button class="btn btn-secondary" id="ue-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
      <button class="btn btn-ghost" id="ue-swap" type="button" title="<?= e(vv_t('url_encoder.swap_title', $lang)) ?>"><?= e(vv_t('url_encoder.swap', $lang)) ?></button>
    </div>
  </div>

  <p class="error-text hidden" id="ue-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('url_encoder.footer', $lang)) ?></p>
</div>