<div class="stack" style="max-width:40rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="ci-domain"><?= e(vv_t('certificate_info.domain', $lang)) ?></label>
    <div class="row" style="gap:0.5rem">
      <input class="input" id="ci-domain" type="text" placeholder="example.com" value="example.com" autocomplete="url" aria-describedby="ci-help ci-error" style="flex:1">
      <button class="btn btn-primary btn-touch" id="ci-run" type="button"><?= icon_svg('GlobeLock', 18) ?> <?= e(vv_t('certificate_info.check_btn', $lang)) ?></button>
    </div>
  </div>
  <div class="progress-track hidden" id="ci-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="ci-prog-label"></p>
  <div class="hidden" id="ci-result">
    <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem">
      <p id="ci-status" class="certificate-status" style="font-size:1.05rem;margin:0.25rem 0" aria-live="polite"></p>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.issuer', $lang)) ?></span><span class="v" id="ci-issuer">—</span></div>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.subject', $lang)) ?></span><span class="v" id="ci-subject">—</span></div>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.valid_from', $lang)) ?></span><span class="v mono" id="ci-from">—</span></div>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.valid_to', $lang)) ?></span><span class="v mono" id="ci-to">—</span></div>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.remaining', $lang)) ?></span><span class="v mono" id="ci-days">—</span></div>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.serial', $lang)) ?></span><span class="v mono" id="ci-serial">—</span></div>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.signature', $lang)) ?></span><span class="v" id="ci-sig">—</span></div>
      <div class="kv"><span class="k"><?= e(vv_t('certificate_info.san', $lang)) ?></span><span class="v" id="ci-san">—</span></div>
    </div>
  </div>
  <p class="error-text hidden" id="ci-error" role="alert"></p>
  <p class="muted" id="ci-help" style="font-size:0.8rem"><?= e(vv_t('certificate_info.note', $lang)) ?></p>
</div>
