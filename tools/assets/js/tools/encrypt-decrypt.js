// Šifrování textu — AES-256-GCM + PBKDF2 (Web Crypto SubtleCrypto). Čistě client-side.
// Formát výstupu: base64( salt[16] || iv[12] || ciphertext||tag )
(function () {
  'use strict';
  var mode = 'enc';
  var seg = ToolUI.el('ed-mode');
  var input = ToolUI.el('ed-input');
  var pass = ToolUI.el('ed-pass');
  var runBtn = ToolUI.el('ed-run');
  var runLabel = ToolUI.el('ed-run-label');
  var clearBtn = ToolUI.el('ed-clear');
  var out = ToolUI.el('ed-output');
  var err = ToolUI.el('ed-error');
  var copyBtn = ToolUI.el('ed-copy');
  var toggle = ToolUI.el('ed-toggle');
  var inputPh = { enc: 'Text k zašifrování…', dec: 'Base64 šifrový text k dešifrování…' };

  function showError(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearError() { err.classList.add('hidden'); err.textContent = ''; }

  // ── Base64 pro binární data (UTF-8 safe) ───────────────────────
  function bytesToB64(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function b64ToBytes(b64) {
    var bin = atob(b64.replace(/\s+/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function deriveKey(password, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
      .then(function (baseKey) {
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: 250000, hash: 'SHA-256' },
          baseKey,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      });
  }

  function encrypt() {
    var text = input.value;
    var pw = pass.value;
    if (!text) { showError('Vložte text k zašifrování.'); return Promise.resolve(); }
    if (!pw) { showError('Zadejte heslo.'); return Promise.resolve(); }
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(pw, salt).then(function (key) {
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(text));
    }).then(function (cipher) {
      var c = new Uint8Array(cipher);
      var out8 = new Uint8Array(salt.length + iv.length + c.length);
      out8.set(salt, 0);
      out8.set(iv, salt.length);
      out8.set(c, salt.length + iv.length);
      out.value = bytesToB64(out8);
      copyBtn.disabled = false;
    });
  }

  function decrypt() {
    var raw = input.value.trim();
    var pw = pass.value;
    if (!raw) { showError('Vložte šifrový text.'); return Promise.resolve(); }
    if (!pw) { showError('Zadejte heslo.'); return Promise.resolve(); }
    var blob;
    try { blob = b64ToBytes(raw); }
    catch (e) { showError('Vstup není platný Base64.'); return Promise.resolve(); }
    if (blob.length < 29) { showError('Šifrový text je příliš krátký nebo poškozen.'); return Promise.resolve(); }
    var salt = blob.slice(0, 16);
    var iv = blob.slice(16, 28);
    var cipher = blob.slice(28);
    return deriveKey(pw, salt).then(function (key) {
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipher);
    }).then(function (plain) {
      out.value = new TextDecoder().decode(plain);
      copyBtn.disabled = false;
    }).catch(function () {
      showError('Dešifrování selhalo — pravděpodobně nesprávné heslo nebo poškozený text.');
    });
  }

  function run() {
    clearError();
    out.value = '';
    copyBtn.disabled = true;
    var p = (mode === 'enc') ? encrypt() : decrypt();
    p.catch(function (e) { showError('Neočekávaná chyba: ' + (e && e.message ? e.message : e)); });
  }

  function setMode(m) {
    mode = m;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (b) {
      var on = b.dataset.mode === m;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    runLabel.textContent = (m === 'enc') ? 'Zašifrovat' : 'Dešifrovat';
    input.placeholder = inputPh[m];
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (b) setMode(b.dataset.mode);
  });

  runBtn.addEventListener('click', run);
  clearBtn.addEventListener('click', function () {
    input.value = ''; pass.value = ''; out.value = ''; clearError(); copyBtn.disabled = true;
  });
  toggle.addEventListener('click', function () {
    var show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    toggle.replaceChild(Icon.build(show ? 'EyeOff' : 'Eye', 18), toggle.firstChild);
  });

  ToolUI.wireCopy(copyBtn, function () { return out.value; }, 'Zkopírováno', 'Kopírovat');

  // Enter v hesle spustí akci.
  pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
  input.addEventListener('input', clearError);

  setMode('enc');
  if (!window.crypto || !crypto.subtle) {
    showError('Váš prohlížeč nepodporuje Web Crypto. Nástroj vyžaduje HTTPS (nebo localhost).');
    runBtn.disabled = true;
  }
})();