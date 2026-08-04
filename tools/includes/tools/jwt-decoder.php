<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="jd-token">JWT token</label>
    <textarea class="textarea mono" id="jd-token" rows="4" placeholder="eyJhbGciOi..." autocomplete="off"></textarea>
  </div>

  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm" style="flex:1;min-width:12rem">
      <label class="field-label" for="jd-secret">Tajný klíč (pro ověření HS256 — volitelné)</label>
      <input class="input mono" type="text" id="jd-secret" placeholder="secret" autocomplete="off">
    </div>
    <button class="btn btn-primary" id="jd-verify" type="button"><?= icon_svg('ShieldCheck', 16) ?> Ověřit podpis</button>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Algoritmus</span><span class="v mono" id="jd-alg">—</span></div>
    <div class="kv"><span class="k">Platnost</span><span class="v" id="jd-status">—</span></div>
  </div>

  <div class="stack-sm">
    <span class="field-label">Hlavička</span>
    <pre class="glass mono" id="jd-header" style="margin:0;padding:0.75rem 1rem;white-space:pre-wrap;word-break:break-all;border-radius:0.5rem">—</pre>
  </div>
  <div class="stack-sm">
    <span class="field-label">Payload</span>
    <pre class="glass mono" id="jd-payload" style="margin:0;padding:0.75rem 1rem;white-space:pre-wrap;word-break:break-all;border-radius:0.5rem">—</pre>
  </div>

  <p class="error-text hidden" id="jd-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Dekódování i ověření podpisu běží lokálně přes Web Crypto. Token se neodesílá na server.</p>
</div>