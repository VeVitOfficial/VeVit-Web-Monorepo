// JWT generátor (HS256), čistě client-side přes Web Crypto.
(function () {
  'use strict';
  var secret = ToolUI.el('jwg-secret'), payload = ToolUI.el('jwg-payload');
  var out = ToolUI.el('jwg-out'), copyBtn = ToolUI.el('jwg-copy'), genBtn = ToolUI.el('jwg-gen');
  var err = ToolUI.el('jwg-error');

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function b64url(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlStr(str) { return b64url(new TextEncoder().encode(str)); }

  async function sign(data, key) {
    var sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    return b64url(new Uint8Array(sig));
  }

  async function generate() {
    clearErr();
    if (!secret.value) return fail('Zadejte tajný klíč (HMAC).');
    var obj;
    try { obj = JSON.parse(payload.value); }
    catch (e) { return fail('Payload není platný JSON: ' + e.message); }
    var key;
    try {
      key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret.value), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    } catch (e) { return fail('Tajný klíč nelze použít.'); }
    try {
      var header = b64urlStr(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      var body = b64urlStr(JSON.stringify(obj));
      var sig = await sign(header + '.' + body, key);
      out.value = header + '.' + body + '.' + sig;
      copyBtn.disabled = false;
    } catch (e) { fail('Generování selhalo: ' + e.message); }
  }

  genBtn.addEventListener('click', generate);
  secret.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); generate(); } });
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
})();