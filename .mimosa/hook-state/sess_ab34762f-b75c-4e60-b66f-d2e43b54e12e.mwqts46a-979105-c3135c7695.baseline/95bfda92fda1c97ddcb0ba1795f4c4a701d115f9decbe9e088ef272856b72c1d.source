// Video → animovaný GIF přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('vg-drop'), list = ToolUI.el('vg-list'), work = ToolUI.el('vg-work');
  var dur = ToolUI.el('vg-dur'), fps = ToolUI.el('vg-fps'), width = ToolUI.el('vg-width');
  var run = ToolUI.el('vg-run'), err = ToolUI.el('vg-error');
  var prog = ToolUI.el('vg-prog'), progLabel = ToolUI.el('vg-prog-label');
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
      var f = Math.max(5, Math.min(24, +fps.value || 10));
      var w = Math.max(120, Math.min(1280, (+width.value || 480)));
      var d = +dur.value || 0;
      FFmpegMedia.runJob({
        file: file, inName: 'in.' + FFmpegMedia.ext(file.name), outName: 'out.gif', outMime: 'image/gif',
        args: function (inN, outN) {
          var vf = 'fps=' + f + ',scale=' + w + ':-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse';
          var a = ['-i', inN];
          if (d > 0) a.push('-t', String(d));
          a.push('-vf', vf, outN);
          return a;
        },
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { ToolUI.download(blob, 'video.gif'); if (window.toast) toast.success('GIF vytvořeno'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
})();