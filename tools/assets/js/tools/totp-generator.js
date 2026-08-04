// TOTP generátor (RFC 6238) — čistě client-side (Web Crypto HMAC-SHA1).
(function () {
  'use strict';
  var secret = ToolUI.el('tp-secret'), issuer = ToolUI.el('tp-issuer'), account = ToolUI.el('tp-account');
  var code = ToolUI.el('tp-code'), fill = ToolUI.el('tp-fill'), timer = ToolUI.el('tp-timer');
  var qrEl = ToolUI.el('tp-qr'), err = ToolUI.el('tp-error');
  var STEP = 30, DIGITS = 6;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function base32Decode(s) {
    var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    s = s.toUpperCase().replace(/[^A-Z2-7]/g, '');
    var bits = '', bytes = [];
    for (var i = 0; i < s.length; i++) bits += ALPHA.indexOf(s[i]).toString(2).padStart(5, '0');
    for (var j = 0; j + 8 <= bits.length; j += 8) bytes.push(parseInt(bits.substr(j, 8), 2));
    return new Uint8Array(bytes);
  }

  function hotp(keyBytes, counter) {
    var buf = new ArrayBuffer(8), dv = new DataView(buf);
    // counter jako 64-bit (používáme jen nízkých 32 bitů pro reálné časy)
    dv.setUint32(0, Math.floor(counter / 0x100000000)); dv.setUint32(4, counter >>> 0);
    return crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
      .then(function (k) { return crypto.subtle.sign('HMAC', k, buf); })
      .then(function (sig) {
        var h = new Uint8Array(sig);
        var off = h[h.length - 1] & 0x0f;
        var bin = ((h[off] & 0x7f) << 24) | ((h[off + 1] & 0xff) << 16) | ((h[off + 2] & 0xff) << 8) | (h[off + 3] & 0xff);
        var otp = bin % Math.pow(10, DIGITS);
        return String(otp).padStart(DIGITS, '0');
      });
  }

  function ensureQr(cb) {
    if (window.qrcode) return cb();
    ToolUI.loadScript('/tools/assets/js/lib/qrcode-generator.min.js', function (ok) { if (!ok || !window.qrcode) return fail('Knihovnu QR se nepodařilo načíst.'); cb(); });
  }

  function otpauthUri() {
    var i = encodeURIComponent(issuer.value || 'VeVit'), a = encodeURIComponent(account.value || 'account');
    var s = encodeURIComponent(secret.value);
    return 'otpauth://totp/' + i + ':' + a + '?secret=' + s + '&issuer=' + i + '&algorithm=SHA1&digits=' + DIGITS + '&period=' + STEP;
  }

  function renderQr() {
    ensureQr(function () {
      try {
        var qr = window.qrcode(0, 'M'); qr.addData(otpauthUri()); qr.make();
        qrEl.textContent = '';
        var img = document.createElement('img');
        img.src = qr.createDataURL(4, 2); img.style.width = '8rem'; img.style.height = '8rem';
        qrEl.appendChild(img);
      } catch (e) { /* ignorujeme */ }
    });
  }

  var lastCode = '';
  function tick() {
    var key = base32Decode(secret.value);
    if (!key.length) { code.textContent = '------'; fill.style.width = '0%'; timer.textContent = '—'; return; }
    var now = Math.floor(Date.now() / 1000);
    var counter = Math.floor(now / STEP);
    var remain = STEP - (now % STEP);
    hotp(key, counter).then(function (otp) {
      lastCode = otp;
      code.textContent = otp;
      fill.style.width = (remain / STEP * 100) + '%';
      timer.textContent = 'Platnost vyprší za ' + remain + ' s';
    }).catch(function (e) { fail('Výpočet TOTP selhal: ' + e.message); });
  }

  function loop() { tick(); setTimeout(loop, 1000); }

  [secret, issuer, account].forEach(function (e) { e.addEventListener('input', function () { clearErr(); tick(); renderQr(); }); });
  renderQr();
  loop();
})();