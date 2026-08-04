<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="fe-mode" role="tablist">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true">Zašifrovat</button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false">Dešifrovat</button>
  </div>
  <div class="dropzone" id="fe-drop">
    <span class="dz-ico"><?= icon_svg('FileKey', 28) ?></span>
    <span class="dz-title" id="fe-drop-title">Přetáhněte soubor k zašifrování</span>
    <span class="dz-hint">Šifrováno AES-256-GCM, klíč odvozen z hesla (PBKDF2)</span>
  </div>
  <div class="file-list hidden" id="fe-list"></div>
  <div class="stack-sm">
    <label class="field-label" for="fe-pass">Heslo</label>
    <input class="input" id="fe-pass" type="password" placeholder="Silné heslo…" autocomplete="new-password">
  </div>
  <button class="btn btn-primary btn-touch" id="fe-run" type="button" disabled><?= icon_svg('Shield', 18) ?> <span id="fe-run-label">Zašifrovat a stáhnout</span></button>
  <div class="progress-track hidden" id="fe-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="fe-prog-label"></p>
  <p class="error-text hidden" id="fe-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Výstup: <span class="mono">.vevitenc</span> (magic + salt[16B] + IV[12B] + ciphertext+tag). Bez hesla soubor neobnovíte — uchovávejte ho bezpečně. Běží lokálně přes Web Crypto.</p>
</div>