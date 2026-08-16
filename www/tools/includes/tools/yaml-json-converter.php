<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="seg" id="yj-mode" role="tablist" aria-label="Směr převodu">
    <button type="button" class="active" data-mode="y2j" role="tab" aria-selected="true">YAML → JSON</button>
    <button type="button" data-mode="j2y" role="tab" aria-selected="false">JSON → YAML</button>
  </div>
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="yj-in">Vstup</label>
      <textarea class="textarea mono" id="yj-in" rows="12" spellcheck="false" placeholder="Vložte YAML nebo JSON…"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="yj-out">Výstup</label>
      <textarea class="textarea mono" id="yj-out" rows="12" readonly spellcheck="false" placeholder="Výstup se zobrazí zde…"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="yj-run" type="button"><?= icon_svg('FileCode', 16) ?> Převést</button>
    <button class="btn btn-secondary" id="yj-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
    <button class="btn btn-ghost" id="yj-swap" type="button">⇅ Prohodit</button>
  </div>
  <p class="error-text hidden" id="yj-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Používá knihovnu js-yaml (načítá se lazy až při převodu). Běží lokálně v prohlížeči.</p>
</div>