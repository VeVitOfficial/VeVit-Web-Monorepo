// QR generátor (text/URL/Wi-Fi/vCard), čistě client-side (qrcode-generator lazy-load).
(function () {
  'use strict';
  var seg = ToolUI.el('qr-type'), ec = ToolUI.el('qr-ec'), size = ToolUI.el('qr-size');
  var img = ToolUI.el('qr-img'), dl = ToolUI.el('qr-dl'), err = ToolUI.el('qr-error');
  var type = 'text';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function val(id) { var e = ToolUI.el(id); return e ? e.value : ''; }
  function esc(s) { return String(s).replace(/([\\;,:])/g, '\\$1'); }

  function buildData() {
    if (type === 'text') return val('qr-text');
    if (type === 'url') return val('qr-url');
    if (type === 'wifi') {
      var ssid = val('qr-ssid'), pass = val('qr-wpass'), enc = val('qr-enc');
      var t = enc.indexOf('WPA') !== -1 ? 'WPA' : enc === 'WEP' ? 'WEP' : 'nopass';
      var hidden = ToolUI.el('qr-hidden').checked;
      return 'WIFI:T:' + t + ';S:' + esc(ssid) + ';P:' + esc(pass) + (hidden ? ';H:true' : '') + ';;';
    }
    var n = val('qr-vn'), sn = val('qr-vp'), t2 = val('qr-vt'), e = val('qr-ve'), u = val('qr-vu');
    return 'BEGIN:VCARD\nVERSION:3.0\nN:' + sn + ';' + n + ';;;\nFN:' + n + ' ' + sn + '\nTEL:' + t2 + '\nEMAIL:' + e + '\nURL:' + u + '\nEND:VCARD';
  }

  function ensure(cb) {
    if (window.qrcode) return cb();
    ToolUI.loadScript('/tools/assets/js/lib/qrcode-generator.min.js', function (ok) {
      if (!ok || !window.qrcode) return fail('Knihovnu qrcode se nepodařilo načíst.');
      cb();
    });
  }

  function gen() {
    clearErr();
    var data = buildData();
    if (!data || !data.trim()) { img.removeAttribute('src'); img.alt = 'QR kód'; dl.disabled = true; return; }
    ensure(function () {
      try {
        var qr = window.qrcode(0, ec.value);
        qr.addData(data); qr.make();
        img.src = qr.createDataURL(+size.value || 6, 2);
        img.alt = 'QR kód: ' + (data.length > 40 ? data.slice(0, 40) + '…' : data);
        dl.disabled = false;
      } catch (e) { fail('Nelze vygenerovat (pravděpodobně příliš dlouhá data): ' + e.message); img.removeAttribute('src'); dl.disabled = true; }
    });
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-type]'); if (!b) return;
    type = b.dataset.type;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.qr-group'), function (g) {
      g.classList.toggle('hidden', g.dataset.for !== type);
    });
    gen();
  });

  ['qr-text', 'qr-url', 'qr-ssid', 'qr-wpass', 'qr-vn', 'qr-vp', 'qr-vt', 'qr-ve', 'qr-vu'].forEach(function (id) {
    var e = ToolUI.el(id); if (e) e.addEventListener('input', gen);
  });
  ToolUI.el('qr-hidden').addEventListener('change', gen);
  ec.addEventListener('change', gen); size.addEventListener('change', gen);
  dl.addEventListener('click', function () {
    if (!img.src) return;
    var a = document.createElement('a'); a.href = img.src; a.download = 'qr-code.png'; a.click();
  });
})();