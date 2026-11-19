// Odstranění pozadí přes ONNX MODNet (onnxruntime-web), čistě client-side.
// Model: Xenova/modnet, vstup [1,3,256,256] RGB, výstup [1,1,256,256] alpha matte.
(function () {
  'use strict';
  var drop = ToolUI.el('bg-drop'), list = ToolUI.el('bg-list'), work = ToolUI.el('bg-work');
  var bgSel = ToolUI.el('bg-bg'), run = ToolUI.el('bg-run'), err = ToolUI.el('bg-error');
  var prog = ToolUI.el('bg-prog'), progLabel = ToolUI.el('bg-prog-label');
  var out = ToolUI.el('bg-out'), card = ToolUI.el('bg-card');
  var file = null, MAX = 25 * 1024 * 1024;
  var MODEL = '/tools/assets/models/modnet.onnx', SIZE = 256;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ensureOrt(cb) { if (window.ort) return cb(); ToolUI.loadScript('/tools/assets/js/lib/onnx/ort.min.js', cb); }
  function setP(p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > MAX) return fail('Obrázek je příliš velký (max ' + ToolUI.fmtSize(MAX) + ').');
      file = f;
      ToolUI.renderFileList(list, [{ name: f.name, size: f.size }], function () { file = null; list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = false;
    },
    onError: fail
  });

  // Načte obrázek do HTMLImageElement a vrátí {img, w, h}.
  function loadImage(f, cb) {
    var url = URL.createObjectURL(f);
    var img = new Image();
    img.onload = function () { URL.revokeObjectURL(url); cb(img); };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  // Preprocess: nakreslí obrázek do canvasu SIZE×SIZE, vrátí Float32Array RGB [1,3,256,256] NCHW.
  function preprocess(img) {
    var c = document.createElement('canvas'); c.width = SIZE; c.height = SIZE;
    var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, SIZE, SIZE);
    var d = ctx.getImageData(0, 0, SIZE, SIZE).data;
    var n = SIZE * SIZE;
    var rgb = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) {
      rgb[0 * n + i] = d[i * 4] / 255;
      rgb[1 * n + i] = d[i * 4 + 1] / 255;
      rgb[2 * n + i] = d[i * 4 + 2] / 255;
    }
    return rgb;
  }

  // Postprocess: alpha [1,1,H,W] → composite na originální rozlišení s vybraným pozadím.
  function postprocess(alpha, img, cb) {
    var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    // Upsample alpha (SIZE×SIZE) na originální rozlišení přes malý canvas.
    var ac = document.createElement('canvas'); ac.width = SIZE; ac.height = SIZE;
    var actx = ac.getContext('2d');
    var aimg = actx.createImageData(SIZE, SIZE);
    for (var i = 0; i < SIZE * SIZE; i++) {
      var v = Math.max(0, Math.min(255, Math.round(alpha[i] * 255)));
      aimg.data[i * 4] = v; aimg.data[i * 4 + 1] = v; aimg.data[i * 4 + 2] = v; aimg.data[i * 4 + 3] = 255;
    }
    actx.putImageData(aimg, 0, 0);

    var out = document.createElement('canvas'); out.width = W; out.height = H;
    var octx = out.getContext('2d');
    // Pozadí
    var bg = bgSel.value;
    if (bg === 'white') { octx.fillStyle = '#ffffff'; octx.fillRect(0, 0, W, H); }
    else if (bg === 'black') { octx.fillStyle = '#000000'; octx.fillRect(0, 0, W, H); }
    else if (bg === 'green') { octx.fillStyle = '#00b140'; octx.fillRect(0, 0, W, H); }
    // else transparent
    // Nakreslit originál
    octx.drawImage(img, 0, 0, W, H);
    // Aplikovat alpha jako masku: vytvořit alpha canvas v plném rozlišení a použít jako destination-in / multiply
    octx.globalCompositeOperation = 'destination-in';
    octx.drawImage(ac, 0, 0, W, H);
    octx.globalCompositeOperation = 'source-over';
    out.toBlob(function (blob) { cb(blob); }, bg === 'transparent' ? 'image/png' : 'image/png', 0.92);
  }

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    setP(5, 'Načítám obrázek…');
    loadImage(file, function (img) {
      if (!img) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; return fail('Obrázek se nepodařilo načíst.'); }
      setP(10, 'Načítám AI model (~26 MB, první spuštění může trvat)…');
      ensureOrt(function () {
        window.ort.env.wasm.wasmPaths = '/tools/assets/js/lib/onnx/';
        window.ort.InferenceSession.create(MODEL).then(function (session) {
          setP(55, 'Zpracovávám (inference)…');
          var input = preprocess(img);
          var tensor = new window.ort.Tensor('float32', input, [1, 3, SIZE, SIZE]);
          return session.run({ input: tensor }).then(function (res) {
            // výstup alpha — najdeme první výstupní tensor [1,1,SIZE,SIZE]
            var keys = Object.keys(res);
            var out0 = res[keys[0]];
            setP(85, 'Skládám výsledek…');
            postprocess(out0.data, img, function (blob) {
              setP(100, 'Hotovo');
              prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
              out.classList.remove('hidden');
              card.innerHTML = '';
              var url = URL.createObjectURL(blob);
              var wrap = document.createElement('div'); wrap.className = 'stack-sm';
              var im = document.createElement('img'); im.src = url; im.alt = 'Výsledek'; im.style.maxWidth = '100%'; im.style.borderRadius = '0.5rem';
              wrap.appendChild(im);
              var dl = document.createElement('button'); dl.type = 'button'; dl.className = 'btn btn-secondary btn-touch';
              dl.textContent = 'Stáhnout PNG';
              dl.addEventListener('click', function () { ToolUI.download(blob, 'bez-pozadi.png'); });
              wrap.appendChild(dl);
              card.appendChild(wrap);
              if (window.toast) toast.success('Pozadí odstraněno');
            });
          });
        }).catch(function (e) {
          prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
          fail(e && e.message ? e.message : 'Zpracování selhalo (nepodařilo se spustit model).');
        });
      });
    });
  });
})();