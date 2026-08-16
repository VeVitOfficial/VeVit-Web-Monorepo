<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="seg" id="b64-mode" role="tablist" aria-label="Režim Base64">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true">Text → Base64</button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false">Base64 → text</button>
    <button type="button" data-mode="file" role="tab" aria-selected="false">Soubor → Base64</button>
  </div>

  <div id="b64-text">
    <div class="stack-sm">
      <label class="field-label" for="b64-in" id="b64-in-label">Vstup (text)</label>
      <textarea class="textarea mono" id="b64-in" rows="4" placeholder="Zadejte text…"></textarea>
    </div>
  </div>

  <div id="b64-file" class="hidden">
    <div class="dropzone" id="b64-drop">
      <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
      <span class="dz-title">Přetáhněte soubor</span>
      <span class="dz-hint">nebo klikněte pro výběr</span>
      <span class="dz-accept">Max ~2 MB (velké soubory zpomalí prohlížeč)</span>
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="b64-out">Výstup</label>
    <textarea class="textarea mono" id="b64-out" rows="5" readonly placeholder="Výstup se zobrazí zde…"></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem">
      <button class="btn btn-secondary" id="b64-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
      <button class="btn btn-ghost" id="b64-clear" type="button">Vyčistit</button>
    </div>
  </div>

  <p class="error-text hidden" id="b64-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Vše běží lokálně v prohlížeči. UTF-8 bezpečné (TextEncoder/Decoder).</p>
</div>