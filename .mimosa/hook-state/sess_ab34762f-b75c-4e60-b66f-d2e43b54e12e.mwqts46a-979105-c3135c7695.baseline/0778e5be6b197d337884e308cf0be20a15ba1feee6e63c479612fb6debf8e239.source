// Steganografie — LSB do RGB kanálů PNG, čistě client-side (canvas).
(function () {
  'use strict';
  var mode = 'enc';
  var seg = ToolUI.el('sg-mode'), encGrp = ToolUI.el('sg-enc-grp'), decGrp = ToolUI.el('sg-dec-grp');
  var drop = ToolUI.el('sg-drop'), list = ToolUI.el('sg-list');
  var text = ToolUI.el('sg-text'), out = ToolUI.el('sg-out');
  var encBtn = ToolUI.el('sg-enc'), decBtn = ToolUI.el('sg-dec'), err = ToolUI.el('sg-error');
  var prog = ToolUI.el('sg-prog'), progLabel = ToolUI.el('sg-prog-label');
  var file = null, img = new Image();

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function imgData() {
    var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    var cx = c.getContext('2d'); cx.drawImage(img, 0, 0);
    return { c: c, cx: cx, data: cx.getImageData(0, 0, c.width, c.height) };
  }

  // hlavička: 32 bitů délky (počet bajtů zprávy) + UTF-8 bajty zprávy
  function setBit(byte, bit, val) { return (byte & 0xFE) | (val ? 1 : 0); }
  function getBit(byte, bit) { return (byte >> bit) & 1; }

  function encodeInto(imageData, bytes) {
    var d = imageData.data;
    var total = (4 + bytes.length) * 8; // 4B délka + zpráva, každý bajt = 8 bitů
    var cap = (d.length / 4) * 3; // RGB kanály (A přeskočit)
    if (total > cap) throw new Error('Zpráva je příliš dlouhá pro tento obrázek (kapacita ~' + Math.floor(cap / 8 - 4) + ' B).');
    var stream = [];
    // 4B délky (big-endian)
    var len = bytes.length;
    for (var i = 0; i < 4; i++) stream.push((len >>> (24 - i * 8)) & 0xFF);
    for (var j = 0; j < bytes.length; j++) stream.push(bytes[j]);
    var bitIdx = 0;
    for (var p = 0; p < d.length && bitIdx < stream.length * 8; p += 4) {
      for (var ch = 0; ch < 3; ch++) { // R, G, B
        if (bitIdx >= stream.length * 8) break;
        var byteIdx = bitIdx >> 3, bitInByte = 7 - (bitIdx & 7);
        d[p + ch] = setBit(d[p + ch], bitInByte, getBit(stream[byteIdx], bitInByte));
        bitIdx++;
      }
    }
  }

  function decodeFrom(imageData) {
    var d = imageData.data;
    // sdílený kurzor napříč celým čtením (hlavička délky + zpráva)
    var p = 0, ch = 0;
    function readBits(n) {
      var out = [], got = 0;
      while (got < n) {
        if (p >= d.length) throw new Error('Konec obrázku — zpráva nenalezena nebo je poškozená.');
        out.push(d[p + ch] & 1); got++;
        ch++; if (ch > 2) { ch = 0; p += 4; }
      }
      return out;
    }
    var lenBits = readBits(32);
    var len = 0; for (var i = 0; i < 32; i++) len = (len << 1) | lenBits[i];
    len = len >>> 0;
    if (len <= 0 || len > 5 * 1024 * 1024) throw new Error('Neplatná délka zprávy (' + len + ') — obrázek pravděpodobně neobsahuje skrytá data.');
    var msgBits = readBits(len * 8);
    var bytes = new Uint8Array(len);
    for (var b = 0; b < len; b++) {
      var v = 0; for (var k = 0; k < 8; k++) v = (v << 1) | msgBits[b * 8 + k];
      bytes[b] = v;
    }
    return new TextDecoder().decode(bytes);
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.type !== 'image/png' && !/\.png$/i.test(f.name)) return fail('Podporován pouze PNG (ztrátové formáty zprávu zničí).');
      if (f.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      file = f;
      ToolUI.renderFileList(list, [file], function () { file = null; ToolUI.renderFileList(list, []); encBtn.disabled = true; decBtn.disabled = true; });
      img.onload = function () { encBtn.disabled = mode !== 'enc' || !text.value.trim(); decBtn.disabled = mode !== 'dec'; };
      img.onerror = function () { fail('Obrázek se nepodařilo načíst.'); };
      img.src = URL.createObjectURL(f);
    },
    onError: fail
  });

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
    encGrp.classList.toggle('hidden', mode !== 'enc'); decGrp.classList.toggle('hidden', mode !== 'dec');
    encBtn.disabled = mode !== 'enc' || !file || !text.value.trim(); decBtn.disabled = mode !== 'dec' || !file;
  });
  text.addEventListener('input', function () { encBtn.disabled = !file || !text.value.trim(); });

  encBtn.addEventListener('click', function () {
    if (!file || !text.value.trim()) return;
    clearErr();
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 30, 'Kóduji zprávu…');
    try {
      var info = imgData();
      var bytes = new TextEncoder().encode(text.value);
      encodeInto(info.data, bytes);
      info.cx.putImageData(info.data, 0, 0);
      ToolUI.setProgress(prog, 80, 'Ukládám PNG…');
      info.c.toBlob(function (blob) {
        ToolUI.setProgress(prog, 100, 'Hotovo');
        prog.classList.add('hidden'); progLabel.classList.add('hidden');
        ToolUI.download(blob, 'stego.png');
        if (window.toast) toast.success('Zpráva skryta');
      }, 'image/png');
    } catch (e) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); fail(e.message); }
  });

  decBtn.addEventListener('click', function () {
    if (!file) return;
    clearErr();
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 40, 'Dekóduji zprávu…');
    try {
      var info = imgData();
      var msg = decodeFrom(info.data);
      out.value = msg;
      ToolUI.setProgress(prog, 100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden');
      if (window.toast) toast.success('Zpráva extrahována');
    } catch (e) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); fail(e.message); }
  });
})();