<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="jwg-secret">Tajný klíč (HMAC)</label>
    <input class="input mono" type="text" id="jwg-secret" placeholder="my-secret" autocomplete="off">
  </div>
  <div class="stack-sm">
    <label class="field-label" for="jwg-payload">Payload (JSON)</label>
    <textarea class="textarea mono" id="jwg-payload" rows="7" spellcheck="false">{
  "sub": "1234567890",
  "name": "Jan Novák",
  "iat": 1700000000
}</textarea>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="jwg-gen" type="button"><?= icon_svg('FileKey', 16) ?> Vygenerovat token</button>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="jwg-out">JWT (HS256)</label>
    <textarea class="textarea mono" id="jwg-out" rows="5" readonly placeholder="eyJhbGciOi…"></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem">
      <button class="btn btn-secondary" id="jwg-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
    </div>
  </div>
  <p class="error-text hidden" id="jwg-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Podpis HS256 přes Web Crypto. Vše běží lokálně — tajný klíč ani token neopustí prohlížeč.</p>
</div>