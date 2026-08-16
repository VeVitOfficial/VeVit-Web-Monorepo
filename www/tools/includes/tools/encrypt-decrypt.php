<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="ed-mode" role="tablist" aria-label="Režim">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true">Šifrovat</button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false">Dešifrovat</button>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ed-input">Text</label>
    <textarea class="textarea input-mono" id="ed-input" placeholder="Text k zašifrování…" style="min-height:9rem"></textarea>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ed-pass">Heslo / klíč</label>
    <div class="row">
      <input class="input" type="password" id="ed-pass" placeholder="Silné heslo" autocomplete="off" style="flex:1">
      <button class="btn btn-ghost btn-icon" type="button" id="ed-toggle" aria-label="Zobrazit heslo"><?= icon_svg('Eye', 18) ?></button>
    </div>
  </div>

  <div class="row">
    <button class="btn btn-primary btn-touch" id="ed-run" type="button"><?= icon_svg('Shield', 18) ?> <span id="ed-run-label">Zašifrovat</span></button>
    <button class="btn btn-ghost" id="ed-clear" type="button"><?= icon_svg('Trash', 16) ?> Vyčistit</button>
  </div>

  <p class="error-text hidden" id="ed-error" role="alert"></p>

  <div class="stack-sm">
    <div class="row-between">
      <span class="muted" style="font-size:0.875rem;font-weight:500">Výstup</span>
      <button class="btn btn-ghost btn-sm" id="ed-copy" disabled type="button">
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
        <span class="label">Kopírovat</span>
      </button>
    </div>
    <textarea class="textarea input-mono" id="ed-output" readonly placeholder="Výsledek se zobrazí zde…" style="min-height:9rem;background:rgba(19,19,22,0.3)"></textarea>
  </div>

  <div class="privacy-note"><?= icon_svg('ShieldCheck', 16) ?> Šifrování probíhá lokálně přes Web Crypto (AES-256-GCM + PBKDF2). Heslo ani text neopustí váš prohlížeč.</div>
</div>