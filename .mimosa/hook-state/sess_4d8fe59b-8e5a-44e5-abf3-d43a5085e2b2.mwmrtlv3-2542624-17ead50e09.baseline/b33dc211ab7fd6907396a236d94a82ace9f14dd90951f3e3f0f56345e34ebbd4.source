// Komprese videa na cílovou velikost přes ffmpeg.wasm, čistě client-side.
// Bitrate se dopočítá z délky videa (získané přes <video>) a cílové velikosti.
(function () {
  'use strict';
  var drop = ToolUI.el('vts-drop'), list = ToolUI.el('vts-list'), work = ToolUI.el('vts-work');
  var mb = ToolUI.el('vts-mb'), dur = ToolUI.el('vts-dur'), run = ToolUI.el('vts-run'), err = ToolUI.el('vts-error');
  var prog = ToolUI.el('vts-prog'), progLabel = ToolUI.el('vts-prog-label');
  var file = null, duration = 0;
  var AUDIO_BR = 128; // kbps

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ext(name) { var m = name.match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : 'mp4'; }
  function ensureMedia(cb) { if (window.FFmpegMedia) return cb(); ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-wrapper.js', function () { ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-media.js', cb); }); }

  function readDuration(f, cb) {
    var url = URL.createObjectURL(f);
    var v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = function () { duration = v.duration || 0; URL.revokeObjectURL(url); cb(duration); };
    v.onerror = function () { URL.revokeObjectURL(url); cb(0); };
    v.src = url;
  }

  ToolUI.dropzone(drop, {
    accept: ['video/*', '.mp4', '.webm', '.mov', '.mkv', '.avi'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      file = arr[0];
      dur.value = '';
      readDuration(file, function (d) { dur.value = d ? d.toFixed(1) : ''; });
      ToolUI.renderFileList(list, [{ name: file.name, size: file.size }], function () { file = null; list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = false;
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr();
    if (!duration) return fail('Nepodařilo se zjistit délku videa. Zkuste jiný soubor.');
    var targetMB = +mb.value;
    if (!targetMB || targetMB <= 0) return fail('Zadejte cílovou velikost (MB).');
    // bitrate (kbps) = targetBits / duration / 1000 ; odečteme audio, zbytek je video
    var totalKbps = Math.floor((targetMB * 8192) / duration); // kB/s = kbps
    if (totalKbps <= AUDIO_BR) return fail('Cílová velikost je příliš malá na toto video (audio sama spotřebuje ~' + AUDIO_BR + ' kbps). Zvyšte cílovou velikost.');
    var vbr = Math.max(50, totalKbps - AUDIO_BR);
    run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ensureMedia(function () {
      FFmpegMedia.runJob({
        file: file, inName: 'in.' + ext(file.name), outName: 'out.mp4', outMime: 'video/mp4',
        args: function (inN, outN) { return ['-i', inN, '-c:v', 'libx264', '-preset', 'fast', '-b:v', vbr + 'k', '-maxrate', vbr + 'k', '-bufsize', (2 * vbr) + 'k', '-c:a', 'aac', '-b:a', AUDIO_BR + 'k', outN]; },
        runLabel: 'Kóduji (může trvat)…',
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { ToolUI.download(blob, 'cilova-velikost.mp4'); if (window.toast) toast.success('Video zkomprimováno'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
})();