// Konverze audia přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('ac-drop'), list = ToolUI.el('ac-list'), work = ToolUI.el('ac-work');
  var fmt = ToolUI.el('ac-format'), brGrp = ToolUI.el('ac-br-grp'), br = ToolUI.el('ac-br');
  var run = ToolUI.el('ac-run'), err = ToolUI.el('ac-error');
  var prog = ToolUI.el('ac-prog'), progLabel = ToolUI.el('ac-prog-label');
  var file = null;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ensureMedia(cb) { if (window.FFmpegMedia) return cb(); ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-wrapper.js', function () { ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-media.js', cb); }); }

  var CODECS = { mp3: 'libmp3lame', wav: 'pcm_s16le', ogg: 'libvorbis', flac: 'flac' };
  var LOSSY = { mp3: true, ogg: true };

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
  fmt.addEventListener('change', function () { brGrp.classList.toggle('hidden', !LOSSY[fmt.value]); });

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ensureMedia(function () {
      var f = fmt.value;
      FFmpegMedia.runJob({
        file: file, inName: 'in.' + FFmpegMedia.ext(file.name), outName: 'out.' + f, outMime: 'audio/' + f,
        args: function (inN, outN) {
          var a = ['-i', inN, '-c:a', CODECS[f]];
          if (LOSSY[f]) a.push('-b:a', String(+br.value || 192) + 'k');
          a.push('-vn', outN);
          return a;
        },
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { ToolUI.download(blob, 'prevedeno.' + f); if (window.toast) toast.success('Audio převedeno'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
})();