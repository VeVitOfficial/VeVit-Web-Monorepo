// Šifrování souborů AES-256-GCM (PBKDF2), čistě client-side (Web Crypto).
// Formát: magic[8] = "VEVITENC" + version[1] + salt[16] + iv[12] + ciphertext(+GCM tag)
(function () {
  'use strict';
  var mode = 'enc';
  var seg = ToolUI.el('fe-mode'), dropTitle = ToolUI.el('fe-drop-title'), runLabel = ToolUI.el('fe-run-label');
  var drop = ToolUI.el('fe-drop'), list = ToolUI.el('fe-list'), pass = ToolUI.el('fe-pass');
  var run = ToolUI.el('fe-run'), err = ToolUI.el('fe-error');
  var prog = ToolUI.el('fe-prog'), progLabel = ToolUI.el('fe-prog-label');
  var file = null;
  var MAGIC = new Uint8Array([0x56, 0x45, 0x56, 0x49, 0x54, 0x45, 0x4e, 0x43]); // "VEVITENC"
  var VER = 1, MAX = 200 * 1024 * 1024;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function deriveKey(pw, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 250000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
      });
  }

  function renderList() {
    ToolUI.renderFileList(list, file ? [file] : [], function () { file = null; renderList(); run.disabled = !file || !pass.value; });
  }

  ToolUI.dropzone(drop, {
    accept: mode === 'enc' ? ['*'] : ['.vevitenc', 'application/octet-stream'],
    multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > MAX) return fail('Soubor je příliš velký (max ' + ToolUI.fmtSize(MAX) + ').');
      file = f; renderList(); run.disabled = !pass.value;
    },
    onError: fail
  });

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    dropTitle.textContent = mode === 'enc' ? 'Přetáhněte soubor k zašifrování' : 'Přetáhněte .vevitenc k dešifrování';
    runLabel.textContent = mode === 'enc' ? 'Zašifrovat a stáhnout' : 'Dešifrovat a stáhnout';
    file = null; renderList(); run.disabled = true;
  });
  pass.addEventListener('input', function () { run.disabled = !file || !pass.value; });

  run.addEventListener('click', function () {
    if (!file) return; if (!pass.value) return fail('Zadejte heslo.');
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 10, mode === 'enc' ? 'Načítám soubor…' : 'Načítám šifrovaný soubor…');
    file.arrayBuffer().then(function (buf) {
      if (mode === 'enc') return encrypt(buf);
      return decrypt(buf);
    }).then(function (r) {
      ToolUI.setProgress(prog, 100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      ToolUI.download(r.blob, r.name);
      if (window.toast) toast.success(mode === 'enc' ? 'Soubor zašifrován' : 'Soubor dešifrován');
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      fail(e && e.message ? e.message : (mode === 'dec' ? 'Dešifrování selhalo — špatné heslo nebo poškozený soubor.' : 'Šifrování selhalo.'));
    });
  });

  function encrypt(buf) {
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    ToolUI.setProgress(prog, 25, 'Odvozuji klíč (PBKDF2)…');
    return deriveKey(pass.value, salt).then(function (key) {
      ToolUI.setProgress(prog, 50, 'Šifruji (AES-256-GCM)…');
      return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, buf);
    }).then(function (cipher) {
      var c = new Uint8Array(cipher);
      var out = new Uint8Array(MAGIC.length + 1 + salt.length + iv.length + c.length);
      out.set(MAGIC, 0); out[8] = VER; out.set(salt, 9); out.set(iv, 25); out.set(c, 37);
      return { blob: new Blob([out], { type: 'application/octet-stream' }), name: (file.name || 'soubor') + '.vevitenc' };
    });
  }

  function decrypt(buf) {
    var data = new Uint8Array(buf);
    // ověř magic
    for (var i = 0; i < MAGIC.length; i++) if (data[i] !== MAGIC[i]) throw new Error('Soubor není platný .vevitenc (chybný formát).');
    var ver = data[8];
    if (ver !== VER) throw new Error('Nepodporovaná verze formátu (' + ver + ').');
    var salt = data.slice(9, 25), iv = data.slice(25, 37), cipher = data.slice(37);
    ToolUI.setProgress(prog, 25, 'Odvozuji klíč (PBKDF2)…');
    return deriveKey(pass.value, salt).then(function (key) {
      ToolUI.setProgress(prog, 55, 'Dešifruji…');
      return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, cipher);
    }).then(function (plain) {
      var name = file.name.replace(/\.vevitenc$/i, '') || 'soubor';
      return { blob: new Blob([plain], { type: 'application/octet-stream' }), name: name };
    });
  }
})();