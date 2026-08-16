// Ořez videa přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('vt2-drop'), list = ToolUI.el('vt2-list'), work = ToolUI.el('vt2-work');
  var start = ToolUI.el('vt2-start'), end = ToolUI.el('vt2-end'), reenc = ToolUI.el('vt2-reenc');
  var run = ToolUI.el('vt2-run'), err = ToolUI.el('vt2-error');
  var prog = ToolUI.el('vt2-prog'), progLabel = ToolUI.el('vt2-prog-label');
  var file = null;
  var TS = /^\d{1,2}:\d{2}:\d{2}$/;

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
    clearErr();
    if (!TS.test(start.value) || !TS.test(end.value)) return fail('Čas zadávejte ve formátu HH:MM:SS (např. 00:00:05).');
    var outExt = FFmpegMedia.ext(file.name) === 'webm' ? 'webm' : 'mp4';
    var outMime = outExt === 'webm' ? 'video/webm' : 'video/mp4';
    run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ensureMedia(function () {
      FFmpegMedia.runJob({
        file: file, inName: 'in.' + FFmpegMedia.ext(file.name), outName: 'out.' + outExt, outMime: outMime,
        args: function (inN, outN) {
          var a = ['-ss', start.value, '-to', end.value, '-i', inN];
          if (reenc.value === '1') a.push('-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac'); else a.push('-c', 'copy');
          a.push(outN);
          return a;
        },
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { ToolUI.download(blob, 'orez.' + outExt); if (window.toast) toast.success('Video oříznuto'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
})();