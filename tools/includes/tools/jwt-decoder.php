<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="jd-token"><?= e(vv_t('jwt_decoder.token', $lang)) ?></label>
    <textarea class="textarea mono" id="jd-token" rows="4" placeholder="eyJhbGciOi..." autocomplete="off"></textarea>
  </div>

  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm" style="flex:1;min-width:12rem">
      <label class="field-label" for="jd-secret"><?= e(vv_t('jwt_decoder.secret', $lang)) ?></label>
      <input class="input mono" type="text" id="jd-secret" placeholder="secret" autocomplete="off">
    </div>
    <button class="btn btn-primary" id="jd-verify" type="button"><?= icon_svg('ShieldCheck', 16) ?> <?= e(vv_t('jwt_decoder.verify', $lang)) ?></button>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('jwt_decoder.alg', $lang)) ?></span><span class="v mono" id="jd-alg">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('jwt_decoder.validity', $lang)) ?></span><span class="v" id="jd-status">—</span></div>
  </div>

  <div class="stack-sm">
    <span class="field-label"><?= e(vv_t('jwt_decoder.header', $lang)) ?></span>
    <pre class="glass mono" id="jd-header" style="margin:0;padding:0.75rem 1rem;white-space:pre-wrap;word-break:break-all;border-radius:0.5rem">—</pre>
  </div>
  <div class="stack-sm">
    <span class="field-label">Payload</span>
    <pre class="glass mono" id="jd-payload" style="margin:0;padding:0.75rem 1rem;white-space:pre-wrap;word-break:break-all;border-radius:0.5rem">—</pre>
  </div>

  <p class="error-text hidden" id="jd-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('jwt_decoder.footer', $lang)) ?></p>
</div>