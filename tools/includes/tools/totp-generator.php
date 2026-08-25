<div class="stack" style="max-width:40rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="tp-secret"><?= e(vv_t('totp_generator.secret', $lang)) ?></label>
    <input class="input" id="tp-secret" type="text" placeholder="např. JBSWY3DPEHPK3PXP" value="JBSWY3DPEHPK3PXP" autocomplete="off">
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="tp-issuer"><?= e(vv_t('totp_generator.issuer', $lang)) ?></label><input class="input" id="tp-issuer" type="text" placeholder="VeVit" value="VeVit"></div>
    <div class="stack-sm"><label class="field-label" for="tp-account"><?= e(vv_t('totp_generator.account', $lang)) ?></label><input class="input" id="tp-account" type="text" placeholder="uzivatel@example.com"></div>
  </div>
  <div class="glass" style="border-radius:0.75rem;padding:1rem;text-align:center">
    <div class="mono" id="tp-code" style="font-size:2.5rem;letter-spacing:0.3em">------</div>
    <div class="progress-track" style="margin:0.75rem auto;max-width:16rem" id="tp-bar"><div class="progress-fill" id="tp-fill"></div></div>
    <p class="muted" id="tp-timer" style="font-size:0.85rem">—</p>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem;align-items:center">
    <div id="tp-qr" style="background:#fff;padding:0.5rem;border-radius:0.5rem"></div>
    <p class="muted" style="font-size:0.8rem;max-width:18rem"><?= e(vv_t('totp_generator.qr_hint_pre', $lang)) ?><br><br><strong><?= e(vv_t('totp_generator.qr_hint_strong', $lang)) ?></strong> <?= e(vv_t('totp_generator.qr_hint_post', $lang)) ?></p>
  </div>
  <p class="error-text hidden" id="tp-error" role="alert"></p>
</div>