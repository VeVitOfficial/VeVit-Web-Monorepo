// Faktura generátor (pdf-lib + QR Platba/SPD), čistě client-side.
(function () {
  'use strict';
  var rowsEl = ToolUI.el('iv-rows'), addRow = ToolUI.el('iv-add-row'), run = ToolUI.el('iv-run');
  var err = ToolUI.el('iv-error'), prog = ToolUI.el('iv-prog'), progLabel = ToolUI.el('iv-prog-label');
  var withQr = ToolUI.el('iv-qr');

  // výchozí data dnešek + splatnost +14 dní
  function fmt(d) { function p(n) { return String(n).padStart(2, '0'); } return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  (function () {
    var now = new Date(), due = new Date(now.getTime() + 14 * 86400000);
    ToolUI.el('iv-date').value = fmt(now); ToolUI.el('iv-tax').value = fmt(now); ToolUI.el('iv-due').value = fmt(due);
  })();

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  var seed = 0;
  function makeRow(desc, qty, price) {
    var id = ++seed;
    var wrap = document.createElement('div'); wrap.className = 'row'; wrap.style.flexWrap = 'wrap'; wrap.style.gap = '0.5rem'; wrap.style.alignItems = 'center';
    var d = document.createElement('input'); d.className = 'input'; d.type = 'text'; d.placeholder = 'Popis položky'; d.value = desc || ''; d.style.flex = '2'; d.style.minWidth = '12rem'; d.dataset.r = id;
    var q = document.createElement('input'); q.className = 'input'; q.type = 'number'; q.min = '0'; q.step = 'any'; q.value = qty == null ? '1' : qty; q.style.width = '5rem'; q.dataset.r = id;
    var p = document.createElement('input'); p.className = 'input'; p.type = 'number'; p.min = '0'; p.step = '0.01'; p.value = price == null ? '0' : price; p.style.width = '7rem'; p.dataset.r = id;
    var lbl = document.createElement('span'); lbl.className = 'muted'; lbl.style.fontSize = '0.8rem'; lbl.dataset.r = id;
    var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'btn btn-ghost btn-icon-sm'; rm.setAttribute('aria-label', 'Odebrat položku');
    rm.appendChild((window.Icon ? Icon.build('Trash', 16) : document.createTextNode('×')));
    rm.addEventListener('click', function () { wrap.remove(); });
    q.addEventListener('input', function () { lbl.textContent = fmtC(rowTotal(q, p)); });
    p.addEventListener('input', function () { lbl.textContent = fmtC(rowTotal(q, p)); });
    wrap.appendChild(d); wrap.appendChild(q); wrap.appendChild(p); wrap.appendChild(lbl); wrap.appendChild(rm);
    rowsEl.appendChild(wrap);
    lbl.textContent = fmtC(rowTotal(q, p));
    return wrap;
  }
  function rowTotal(q, p) { return (parseFloat(q.value) || 0) * (parseFloat(p.value) || 0); }
  function fmtC(n) { return n.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč'; }

  makeRow('Produkt / služba A', 2, 500);
  makeRow('Produkt / služba B', 1, 1200);
  addRow.addEventListener('click', function () { makeRow('', 1, 0); });

  function collect() {
    var items = [];
    Array.prototype.forEach.call(rowsEl.children, function (wrap) {
      var d = wrap.querySelector('input[type=text]');
      var q = wrap.querySelectorAll('input[type=number]')[0];
      var p = wrap.querySelectorAll('input[type=number]')[1];
      var qty = parseFloat(q.value) || 0, price = parseFloat(p.value) || 0;
      if (!d.value.trim() && !qty && !price) return;
      items.push({ desc: d.value.trim(), qty: qty, price: price, total: qty * price });
    });
    return items;
  }

  function spdString(o, total) {
    var parts = ['SPD', '1.0'];
    parts.push('ACC:' + (o.iban || '').replace(/\s+/g, '').toUpperCase());
    parts.push('AM:' + total.toFixed(2));
    parts.push('CC:CZK');
    if (o.due) parts.push('DT:' + o.due.replace(/-/g, ''));
    var msg = 'Faktura ' + (o.num || '');
    parts.push('MSG:' + msg.substring(0, 60));
    if (o.vs) parts.push('XVS:' + o.vs);
    if (o.ks) parts.push('XKS:' + o.ks);
    return parts.join('*');
  }

  function ensureQr() {
    if (window.qrcode) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/qrcode-generator.min.js');
  }
  function makeQrPng(data) {
    return ensureQr().then(function () {
      var qr = window.qrcode(0, 'M'); qr.addData(data); qr.make();
      var url = qr.createDataURL(8, 2);
      return fetch(url).then(function (r) { return r.arrayBuffer(); });
    });
  }

  function wrapText(text, font, size, maxW) {
    var words = String(text).split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (font.widthOfTextAtSize(t, size) > maxW && cur) { lines.push(cur); cur = w; }
      else cur = t;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  run.addEventListener('click', function () {
    clearErr();
    var items = collect();
    if (!items.length) return fail('Přidejte alespoň jednu položku.');
    var vat = parseFloat(ToolUI.el('iv-vat').value) || 0;
    var subtotal = items.reduce(function (a, b) { return a + b.total; }, 0);
    var vatAmt = subtotal * vat / 100, total = subtotal + vatAmt;

    var o = {
      num: ToolUI.el('iv-num').value, date: ToolUI.el('iv-date').value, tax: ToolUI.el('iv-tax').value,
      due: ToolUI.el('iv-due').value, iban: ToolUI.el('iv-iban').value, vs: ToolUI.el('iv-vs').value, ks: ToolUI.el('iv-ks').value,
      supName: ToolUI.el('iv-sup-name').value, supAddr: ToolUI.el('iv-sup-addr').value, supIco: ToolUI.el('iv-sup-ico').value, supDic: ToolUI.el('iv-sup-dic').value,
      cusName: ToolUI.el('iv-cus-name').value, cusAddr: ToolUI.el('iv-cus-addr').value, cusIco: ToolUI.el('iv-cus-ico').value
    };
    if (!o.supName.trim()) return fail('Vyplňte název dodavatele.');
    if (!o.iban.trim()) return fail('Vyplňte IBAN.');

    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 5, 'Načítám pdf-lib…');
    var P = window.PDFLib;
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      var qrP = withQr.checked ? makeQrPng(spdString(o, total)) : Promise.resolve(null);
      var doc = P.PDFDocument.create();
      var fontR = doc.embedFont(P.StandardFonts.Helvetica);
      var fontB = doc.embedFont(P.StandardFonts.HelveticaBold);
      return Promise.all([qrP, fontR, fontB]).then(function (arr) {
        var qrBuf = arr[0], font = arr[1], bold = arr[2];
        ToolUI.setProgress(prog, 40, 'Kreslím fakturu…');
        var W = 595.28, H = 841.89, m = 40, black = P.rgb(0.1, 0.1, 0.1), gray = P.rgb(0.45, 0.45, 0.45);
        var pg = doc.addPage([W, H]);
        function text(str, x, y, size, f, color) { pg.drawText(String(str), { x: x, y: H - y, size: size || 10, font: f || font, color: color || black }); }
        function lines(str, x, y, size, f, maxW, lh, color) {
          wrapText(str, f || font, size || 10, maxW).forEach(function (ln, i) { text(ln, x, y + i * (lh || 13), size, f, color); });
        }
        // Hlavička
        text('FAKTURA', m, 50, 26, bold, black);
        text('č. ' + (o.num || '—'), m + 160, 50, 14, font, gray);
        // Dodavatel / Odběratel
        text('Dodavatel', m, 95, 9, bold, gray);
        text(o.supName || '', m, 110, 11, bold);
        lines(o.supAddr || '', m, 124, 9, font, W / 2 - m - 10, 12);
        if (o.supIco) text('IČO: ' + o.supIco, m, 160, 9, font, gray);
        if (o.supDic) text('DIČ: ' + o.supDic, m, 173, 9, font, gray);

        text('Odběratel', W / 2 + 5, 95, 9, bold, gray);
        text(o.cusName || '', W / 2 + 5, 110, 11, bold);
        lines(o.cusAddr || '', W / 2 + 5, 124, 9, font, W / 2 - m - 10, 12);
        if (o.cusIco) text('IČO: ' + o.cusIco, W / 2 + 5, 160, 9, font, gray);

        // Datumy
        text('Datum vystavení: ' + csDate(o.date), m, 205, 9, font, gray);
        text('Datum zdan. plnění: ' + csDate(o.tax), m, 218, 9, font, gray);
        text('Splatnost: ' + csDate(o.due), m, 231, 9, font, gray);

        // Tabulka položek
        var ty = 260;
        pg.drawLine({ start: { x: m, y: H - ty }, end: { x: W - m, y: H - ty }, thickness: 1, color: black });
        text('Popis', m, ty + 13, 9, bold); text('Množství', W - m - 240, ty + 13, 9, bold); text('Jed. cena', W - m - 150, ty + 13, 9, bold); text('Celkem', W - m - 70, ty + 13, 9, bold);
        ty += 26;
        items.forEach(function (it) {
          lines(it.desc, m, ty, 9, font, W - m - 260, 12);
          text(it.qty, W - m - 240, ty, 9, font);
          text(fmtN(it.price), W - m - 150, ty, 9, font);
          text(fmtN(it.total), W - m - 70, ty, 9, font, black);
          ty += Math.max(14, wrapText(it.desc, font, 9, W - m - 260).length * 12) + 4;
        });
        pg.drawLine({ start: { x: m, y: H - ty }, end: { x: W - m, y: H - ty }, thickness: 0.5, color: gray });

        // Součty + platba
        var sy = ty + 15;
        text('Základ (bez DPH):', W - m - 200, sy, 9, font, gray); text(fmtN(subtotal) + ' Kč', W - m - 70, sy, 9, font, black);
        text('DPH ' + fmtN(vat) + '%:', W - m - 200, sy + 14, 9, font, gray); text(fmtN(vatAmt) + ' Kč', W - m - 70, sy + 14, 9, font, black);
        text('Celkem k úhradě:', W - m - 200, sy + 32, 11, bold, black); text(fmtN(total) + ' Kč', W - m - 70, sy + 32, 11, bold, black);

        // QR + platební údaje vlevo
        if (qrBuf) {
          return doc.embedPng(qrBuf).then(function (qrImg) {
            var qs = 110;
            pg.drawImage(qrImg, { x: m, y: H - (sy + 30) - qs, width: qs, height: qs });
            var px = m + qs + 14;
            text('Platební údaje', px, sy + 5, 9, bold, gray);
            text('IBAN: ' + o.iban, px, sy + 18, 9, font);
            if (o.vs) text('VS: ' + o.vs, px, sy + 31, 9, font);
            if (o.ks) text('KS: ' + o.ks, px, sy + 44, 9, font);
            text('Naskenujte QR pro platbu', px, sy + 70, 8, font, gray);
            return finish();
          });
        }
        return finish();
        function finish() {
          ToolUI.setProgress(prog, 85, 'Ukládám…');
          return doc.save({ useObjectStreams: true }).then(function (bytes) {
            ToolUI.setProgress(prog, 100, 'Hotovo');
            prog.classList.add('hidden'); progLabel.classList.add('hidden');
            ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'faktura-' + (o.num || 'doklad') + '.pdf');
            if (window.toast) toast.success('Faktura vygenerována');
          });
        }
      });
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden');
      fail(e && e.message ? e.message : 'Generování faktury selhalo.');
    });
  });

  function fmtN(n) { return n.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function csDate(s) { if (!s) return '—'; var p = s.split('-'); return p[2] + '. ' + p[1] + '. ' + p[0]; }
})();