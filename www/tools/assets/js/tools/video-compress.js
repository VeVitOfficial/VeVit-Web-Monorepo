// Komprese videa přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('vco-drop'), list = ToolUI.el('vco-list'), work = ToolUI.el('vco-work');
  var res = ToolUI.el('vco-res'), crf = ToolUI.el('vco-crf'), run = ToolUI.el('vco-run'), err = ToolUI.el('vco-error');
  var prog = ToolUI.el('vco-prog'), progLabel = ToolUI.el('vco-prog-label');
  var file = null;

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
      FFmpegMedia.runJob({
        file: file, inName: 'in.' + FFmpegMedia.ext(file.name), outName: 'out.mp4', outMime: 'video/mp4',
        args: function (inN, outN) {
          var a = ['-i', inN];
          if (res.value) a.push('-vf', 'scale=' + res.value);
          a.push('-c:v', 'libx264', '-preset', 'fast', '-crf', String(+crf.value || 28), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outN);
          return a;
        },
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { ToolUI.download(blob, 'komprimovano.mp4'); if (window.toast) toast.success('Video komprimováno'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
})();