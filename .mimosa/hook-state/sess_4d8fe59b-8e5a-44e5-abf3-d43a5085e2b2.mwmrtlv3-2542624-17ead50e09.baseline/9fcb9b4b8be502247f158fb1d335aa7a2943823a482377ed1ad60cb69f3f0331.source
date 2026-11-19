// Ořez audia + normalizace hlasitosti přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('atn-drop'), list = ToolUI.el('atn-list'), work = ToolUI.el('atn-work');
  var start = ToolUI.el('atn-start'), end = ToolUI.el('atn-end'), fmt = ToolUI.el('atn-format'), norm = ToolUI.el('atn-norm');
  var run = ToolUI.el('atn-run'), err = ToolUI.el('atn-error');
  var prog = ToolUI.el('atn-prog'), progLabel = ToolUI.el('atn-prog-label');
  var file = null;
  var TS = /^\d{1,2}:\d{2}:\d{2}$/;
  var CODECS = { mp3: 'libmp3lame', wav: 'pcm_s16le', ogg: 'libvorbis' };

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ensureMedia(cb) { if (window.FFmpegMedia) return cb(); ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-wrapper.js', function () { ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-media.js', cb); }); }

  ToolUI.dropzone(drop, {
    accept: ['audio/*', '.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      file = arr[0];
      ToolUI.renderFileList(list, [{ name: file.name, size: file.size }], function () { file = null; list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = false;
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr();
    if (!TS.test(start.value) || !TS.test(end.value)) return fail('Čas zadávejte ve formátu HH:MM:SS (např. 00:00:05).');
    run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ensureMedia(function () {
      var f = fmt.value;
      FFmpegMedia.runJob({
        file: file, inName: 'in.' + FFmpegMedia.ext(file.name), outName: 'out.' + f, outMime: 'audio/' + f,
        args: function (inN, outN) {
          var a = ['-ss', start.value, '-to', end.value, '-i', inN];
          if (norm.checked) a.push('-af', 'loudnorm');
          a.push('-c:a', CODECS[f]);
          if (f === 'mp3' || f === 'ogg') a.push('-b:a', '192k');
          a.push(outN);
          return a;
        },
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { ToolUI.download(blob, 'audio.' + f); if (window.toast) toast.success('Audio upraveno'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
})();