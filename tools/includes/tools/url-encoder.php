<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="seg" id="ue-mode" role="tablist" aria-label="Režim URL kódování">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true">Kódovat (encode)</button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false">Dekódovat (decode)</button>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ue-in">Vstup</label>
    <textarea class="textarea mono" id="ue-in" rows="4" placeholder="Zadejte text nebo URL…"></textarea>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ue-out">Výstup</label>
    <textarea class="textarea mono" id="ue-out" rows="4" readonly placeholder="Výstup se zobrazí zde…"></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem">
      <button class="btn btn-secondary" id="ue-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
      <button class="btn btn-ghost" id="ue-swap" type="button" title="Použít výstup jako vstup">⇅ Prohodit</button>
    </div>
  </div>

  <p class="error-text hidden" id="ue-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Používá encodeURIComponent / decodeURIComponent. Běží lokálně v prohlížeči.</p>
</div>