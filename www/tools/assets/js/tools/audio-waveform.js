// Křivka audia — Web Audio API decodeAudioData, render na canvas, export PNG/SVG.
(function () {
  'use strict';
  var drop = ToolUI.el('aw-drop'), list = ToolUI.el('aw-list'), work = ToolUI.el('aw-work');
  var cv = ToolUI.el('aw-canvas'), ctx = cv.getContext('2d');
  var color = ToolUI.el('aw-color'), bg = ToolUI.el('aw-bg'), bars = ToolUI.el('aw-bars');
  var png = ToolUI.el('aw-png'), svg = ToolUI.el('aw-svg'), err = ToolUI.el('aw-error');
  var prog = ToolUI.el('aw-prog'), progLabel = ToolUI.el('aw-prog-label');
  var peaks = null; // pole maximálních amplitud

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  function draw() {
    if (!peaks) return;
    var n = Math.max(20, Math.min(1000, parseInt(bars.value, 10) || 200));
    var W = 1200, H = 300; cv.width = W; cv.height = H;
    ctx.fillStyle = bg.value; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = color.value;
    var bw = W / n, mid = H / 2;
    for (var i = 0; i < n; i++) {
      var idx = Math.floor(i * peaks.length / n);
      var v = peaks[idx]; // 0..1
      var bh = Math.max(1, v * mid);
      ctx.fillRect(i * bw, mid - bh, Math.max(1, bw - 1), bh * 2);
    }
    png.disabled = false; svg.disabled = false;
  }

  function computePeaks(buffer) {
    var ch = buffer.getChannelData(0);
    var n = Math.max(20, Math.min(1000, parseInt(bars.value, 10) || 200));
    var block = Math.floor(ch.length / n);
    var out = [];
    for (var i = 0; i < n; i++) {
      var max = 0;
      for (var j = 0; j < block; j++) {
        var s = Math.abs(ch[i * block + j] || 0);
        if (s > max) max = s;
      }
      out.push(max);
    }
    // normalizace na největší peak
    var peak = 0; out.forEach(function (v) { if (v > peak) peak = v; });
    return peak > 0 ? out.map(function (v) { return v / peak; }) : out;
  }

  ToolUI.dropzone(drop, {
    accept: ['audio/*', '.mp3', '.wav', '.ogg', '.m4a', '.flac'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 100 * 1024 * 1024) return fail('Audio je příliš velké (max 100 MB).');
      ToolUI.renderFileList(list, [{ name: f.name, size: f.size }], function () { list.classList.add('hidden'); work.classList.add('hidden'); });
      list.classList.remove('hidden');
      prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
      ToolUI.setProgress(prog, 20, 'Dekóduji audio…');
      f.arrayBuffer().then(function (buf) {
        var AC = window.AudioContext || window.webkitAudioContext;
        var ac = new AC();
        return ac.decodeAudioData(buf);
      }).then(function (buffer) {
        ToolUI.setProgress(prog, 70, 'Počítám křivku…');
        peaks = computePeaks(buffer);
        draw();
        ToolUI.setProgress(prog, 100, 'Hotovo');
        prog.classList.add('hidden'); progLabel.classList.add('hidden');
        work.classList.remove('hidden');
        if (window.toast) toast.success('Křivka vykreslena');
      }).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden');
        fail(e && e.message ? e.message : 'Dekódování audia selhalo (nepodporovaný formát?).');
      });
    },
    onError: fail
  });
  [color, bg, bars].forEach(function (e) { e.addEventListener('input', draw); e.addEventListener('change', draw); });

  png.addEventListener('click', function () { cv.toBlob(function (b) { ToolUI.download(b, 'křivka.png'); }, 'image/png'); });
  svg.addEventListener('click', function () {
    var n = peaks.length, W = 1200, H = 300, bw = W / n, mid = H / 2;
    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><rect width="' + W + '" height="' + H + '" fill="' + bg.value + '"/>'];
    for (var i = 0; i < n; i++) {
      var bh = Math.max(1, peaks[i] * mid);
      parts.push('<rect x="' + (i * bw).toFixed(1) + '" y="' + (mid - bh).toFixed(1) + '" width="' + Math.max(1, bw - 1).toFixed(1) + '" height="' + (bh * 2).toFixed(1) + '" fill="' + color.value + '"/>');
    }
    parts.push('</svg>');
    ToolUI.download(new Blob([parts.join('')], { type: 'image/svg+xml' }), 'křivka.svg');
  });
})();