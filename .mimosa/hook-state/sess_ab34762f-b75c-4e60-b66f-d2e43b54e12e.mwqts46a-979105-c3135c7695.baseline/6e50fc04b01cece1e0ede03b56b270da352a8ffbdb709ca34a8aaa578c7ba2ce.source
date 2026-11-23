// Obrázky → PDF přes pdf-lib, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('ip-drop'), work = ToolUI.el('ip-work'), list = ToolUI.el('ip-list');
  var orient = ToolUI.el('ip-orient'), margin = ToolUI.el('ip-margin'), fitA4 = ToolUI.el('ip-fitA4');
  var run = ToolUI.el('ip-run'), err = ToolUI.el('ip-error');
  var prog = ToolUI.el('ip-prog'), progLabel = ToolUI.el('ip-prog-label');
  var imgs = []; // {name, buf (ArrayBuffer), w, h, type}

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function renderList() {
    ToolUI.renderFileList(list, imgs.map(function (it) { return { name: it.name, size: it.buf.byteLength }; }), function (i) { imgs.splice(i, 1); renderList(); run.disabled = !imgs.length; }, {
      reorder: true, onMove: function (i, d) { var j = i + d; if (j < 0 || j >= imgs.length) return; var t = imgs[i]; imgs[i] = imgs[j]; imgs[j] = t; renderList(); }
    });
  }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp'], multiple: true,
    onFiles: function (arr) {
      clearErr();
      var total = arr.length, done = 0;
      arr.forEach(function (f) {
        if (f.size > 25 * 1024 * 1024) { fail('Obrázek ' + f.name + ' je příliš velký (max 25 MB).'); done++; return; }
        var fr = new FileReader();
        fr.onload = function () {
          var img = new Image();
          img.onload = function () {
            // WebP/JPEG překódujeme na PNG (pdf-lib nativně vkládá PNG/JPG; WebP neumí).
            if (f.type === 'image/webp' || f.type === 'image/jpeg') {
              var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
              var cx = c.getContext('2d'); if (f.type === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); }
              cx.drawImage(img, 0, 0);
              c.toBlob(function (b) { pushImg(b, 'image/png', f.name, img); }, 'image/png');
            } else { pushImg(new Blob([fr.result], { type: f.type }), f.type, f.name, img); }
          };
          img.onerror = function () { fail('Obrázek ' + f.name + ' nelze načíst.'); done++; check(); };
          img.src = fr.result;
        };
        fr.readAsArrayBuffer(f);
      });
      function pushImg(blob, type, name, img) {
        blob.arrayBuffer().then(function (buf) {
          imgs.push({ name: name, buf: buf, w: img.naturalWidth, h: img.naturalHeight, type: type });
          done++; check();
        });
      }
      function check() {
        if (done < total) return;
        if (imgs.length < 1) return;
        work.classList.remove('hidden'); renderList(); run.disabled = !imgs.length;
      }
    },
    onError: fail
  });

  var A4 = { w: 595.28, h: 841.89 }; // pt
  run.addEventListener('click', function () {
    if (!imgs.length) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 10, 'Načítám pdf-lib…');
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      var dst = window.PDFLib.PDFDocument.create();
      var m = +margin.value || 0;
      var chain = Promise.resolve();
      imgs.forEach(function (it, idx) {
        chain = chain.then(function () {
          var emb = it.type === 'image/png' ? dst.embedPng(it.buf) : dst.embedJpg(it.buf);
          return emb.then(function (imgObj) {
            ToolUI.setProgress(prog, 10 + Math.round(80 * idx / imgs.length), 'Vkládám ' + (idx + 1) + '/' + imgs.length);
            var iw = it.w, ih = it.h;
            var pw, ph;
            if (fitA4.checked) {
              var availW = A4.w - 2 * m, availH = A4.h - 2 * m;
              var s = Math.min(availW / iw, availH / ih);
              pw = iw * s; ph = ih * s;
              var pageW = orient.value === 'l' || (orient.value === 'auto' && iw > ih) ? A4.h : A4.w;
              var pageH = orient.value === 'l' || (orient.value === 'auto' && iw > ih) ? A4.w : A4.h;
              var pg = dst.addPage([pageW, pageH]);
              pg.drawImage(imgObj, { x: (pageW - pw) / 2, y: (pageH - ph) / 2, width: pw, height: ph });
            } else {
              var pageW2 = iw + 2 * m, pageH2 = ih + 2 * m;
              var pg2 = dst.addPage([pageW2, pageH2]);
              pg2.drawImage(imgObj, { x: m, y: m, width: iw, height: ih });
            }
          });
        });
      });
      return chain.then(function () {
        ToolUI.setProgress(prog, 92, 'Ukládám…');
        return dst.save({ useObjectStreams: true });
      });
    }).then(function (bytes) {
      ToolUI.setProgress(prog, 100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'obrazky.pdf');
      if (window.toast) toast.success('PDF vytvořeno');
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      fail(e && e.message ? e.message : 'Vytvoření PDF selhalo.');
    });
  });
})();