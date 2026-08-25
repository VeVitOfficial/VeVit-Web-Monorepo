<div class="stack" style="max-width:40rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="bp-pass"><?= e(vv_t('password_breach_check.label', $lang)) ?></label>
    <div class="row" style="gap:0.5rem">
      <input class="input" id="bp-pass" type="password" placeholder="<?= e(vv_t('password_breach_check.ph', $lang)) ?>" autocomplete="off" style="flex:1">
      <button class="btn btn-ghost" id="bp-toggle" type="button" aria-label="<?= e(vv_t('password_breach_check.toggle_aria', $lang)) ?>"><?= icon_svg('Eye', 16) ?></button>
    </div>
  </div>
  <button class="btn btn-primary btn-touch" id="bp-run" type="button"><?= icon_svg('Fingerprint', 18) ?> <?= e(vv_t('password_breach_check.run', $lang)) ?></button>
  <div class="progress-track hidden" id="bp-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="bp-prog-label"></p>
  <div class="glass" style="border-radius:0.75rem;padding:1rem" id="bp-result" hidden>
    <p id="bp-status" style="font-size:1.1rem"></p>
    <p class="muted" id="bp-detail" style="font-size:0.85rem;margin-top:0.5rem"></p>
  </div>
  <p class="error-text hidden" id="bp-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('password_breach_check.footer_pre', $lang)) ?><strong><?= e(vv_t('password_breach_check.footer_strong', $lang)) ?></strong><?= e(vv_t('password_breach_check.footer_post', $lang)) ?></p>
</div>