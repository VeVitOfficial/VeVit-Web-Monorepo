// JWT dekodér — base64url decode + volitelné ověření HS256 přes Web Crypto.
(function () {
  'use strict';
  var tokenEl = ToolUI.el('jd-token'), secret = ToolUI.el('jd-secret');
  var algEl = ToolUI.el('jd-alg'), statusEl = ToolUI.el('jd-status');
  var headerEl = ToolUI.el('jd-header'), payloadEl = ToolUI.el('jd-payload');
  var err = ToolUI.el('jd-error');

  function b64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    var bin = atob(str);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  function b64urlStr(str) {
    var bytes = b64urlDecode(str);
    // UTF-8 safe decode
    return new TextDecoder('utf-8').decode(bytes);
  }
  function pretty(json) {
    try { return JSON.stringify(JSON.parse(json), null, 2); } catch (e) { return json; }
  }
  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent=''; }

  async function verifyHs256(msgB64url, sigB64url, secretStr) {
    var keyData = new TextEncoder().encode(secretStr);
    var key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    var sig = b64urlDecode(sigB64url);
    var msg = new TextEncoder().encode(msgB64url);
    return crypto.subtle.verify('HMAC', key, sig, msg);
  }

  async function decode() {
    clearErr();
    var raw = tokenEl.value.trim();
    if (!raw) { algEl.textContent='—'; statusEl.textContent='—'; headerEl.textContent='—'; payloadEl.textContent='—'; return; }
    var parts = raw.split('.');
    if (parts.length < 2) return fail('JWT musí mít alespoň 2 části oddělené tečkou (header.payload).');
    try {
      var header = JSON.parse(b64urlStr(parts[0]));
      var payload = JSON.parse(b64urlStr(parts[1]));
      algEl.textContent = header.alg || '—';
      headerEl.textContent = pretty(JSON.stringify(header));
      payloadEl.textContent = pretty(JSON.stringify(payload));
      // stav platnosti podle exp/nbf
      var now = Math.floor(Date.now()/1000);
      var st = [], col = 'var(--color-emerald)';
      if (payload.exp) { if (now >= payload.exp) { st.push('vypršel ' + new Date(payload.exp*1000).toLocaleString('cs-CZ')); col='var(--color-red)'; } else st.push('platný do ' + new Date(payload.exp*1000).toLocaleString('cs-CZ')); }
      else st.push('bez exp');
      if (payload.nbf && now < payload.nbf) { st.push('ještě neplatný'); col='var(--color-amber)'; }
      statusEl.textContent = st.join(' · '); statusEl.style.color = col;
    } catch (e) { return fail('Nelze dekódovat — neplatný JWT (špatný base64url).'); }
  }

  async function doVerify() {
    clearErr();
    var raw = tokenEl.value.trim();
    var parts = raw.split('.');
    if (parts.length < 3) return fail('Pro ověření podpisu je potřeba token se 3 částmi (header.payload.signature).');
    var sec = secret.value;
    if (!sec) return fail('Zadejte tajný klíč pro ověření HS256.');
    try {
      var header = JSON.parse(b64urlStr(parts[0]));
      if (header.alg !== 'HS256') return fail('Ověření podporováno jen pro HS256 (token používá ' + (header.alg||'?') + ').');
      var ok = await verifyHs256(parts[0]+'.'+parts[1], parts[2], sec);
      if (window.toast) ok ? toast.success('Podpis je platný') : toast.error('Podpis NEPLATNÝ');
      statusEl.textContent = ok ? 'Podpis platný ✓' : 'Podpis NEPLATNÝ ✗';
      statusEl.style.color = ok ? 'var(--color-emerald)' : 'var(--color-red)';
    } catch (e) { fail('Ověření selhalo: ' + (e.message||e)); }
  }

  tokenEl.addEventListener('input', decode);
  ToolUI.el('jd-verify').addEventListener('click', doVerify);
})();