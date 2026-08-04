<div class="stack" style="max-width:40rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="tk-len">Délka</label><input class="input" id="tk-len" type="number" value="32" min="4" max="256" style="width:6rem"></div>
    <div class="stack-sm"><label class="field-label" for="tk-count">Počet tokenů</label><input class="input" id="tk-count" type="number" value="1" min="1" max="100" style="width:6rem"></div>
  </div>
  <div class="stack-sm">
    <span class="field-label">Znaková sada</span>
    <div class="seg" id="tk-charset" role="tablist">
      <button type="button" class="active" data-cs="alnum" role="tab" aria-selected="true">Alfanumerické</button>
      <button type="button" data-cs="hex" role="tab" aria-selected="false">Hex</button>
      <button type="button" data-cs="b64" role="tab" aria-selected="false">Base64</button>
      <button type="button" data-cs="all" role="tab" aria-selected="false">Vše + speciální</button>
    </div>
  </div>
  <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" id="tk-excamb" checked> Vyloučit zaměnitelné (0/O/1/l/I)</label>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary btn-touch" id="tk-gen" type="button"><?= icon_svg('Zap', 18) ?> Vygenerovat</button>
    <button class="btn btn-secondary" id="tk-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
  </div>
  <textarea class="textarea" id="tk-out" rows="6" readonly placeholder="Tokeny se zobrazí zde…"></textarea>
  <p class="error-text hidden" id="tk-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Kryptograficky náhodné přes crypto.getRandomValues. Běží lokálně.</p>
</div>