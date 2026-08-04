// Extrakce audia z videa přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('va-drop'), list = ToolUI.el('va-list'), work = ToolUI.el('va-work');
  var fmt = ToolUI.el('va-format'), br = ToolUI.el('va-br'), run = ToolUI.el('va-run'), err = ToolUI.el('va-error');
  var prog = ToolUI.el('va-prog'), progLabel = ToolUI.el('va-prog-label');
  var file = null;
  var CODECS = { mp3: 'libmp3lame', wav: 'pcm_s16le', ogg: 'libvorbis', flac: 'flac' };
  var LOSSY = { mp3: true, ogg: true };

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ensureMedia(cb) { if (window.FFmpegMedia) return cb(); ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-wrapper.js', function () { ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-media.js', cb); }); }

  ToolUI.dropzone(drop, {
    accept: ['video/*', '.mp4', '.webm', '.mov', '.mkv', '.avi'], multiple: false,
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
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ensureMedia(function () {
      var f = fmt.value;
      FFmpegMedia.runJob({
        file: file, inName: 'in.' + FFmpegMedia.ext(file.name), outName: 'out.' + f, outMime: 'audio/' + f,
        args: function (inN, outN) { var a = ['-i', inN, '-vn', '-c:a', CODECS[f]]; if (LOSSY[f]) a.push('-b:a', String(+br.value || 192) + 'k'); a.push(outN); return a; },
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { ToolUI.download(blob, 'audio.' + f); if (window.toast) toast.success('Audio extrahováno'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
})();