// Ořez videa přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('vt2-drop'), list = ToolUI.el('vt2-list'), work = ToolUI.el('vt2-work');
  var start = ToolUI.el('vt2-start'), end = ToolUI.el('vt2-end'), reenc = ToolUI.el('vt2-reenc');
  var run = ToolUI.el('vt2-run'), err = ToolUI.el('vt2-error');
  var preview = ToolUI.el('vt2-preview'), resultPreview = ToolUI.el('vt2-result-preview');
  var startRange = ToolUI.el('vt2-start-range'), endRange = ToolUI.el('vt2-end-range'), summary = ToolUI.el('vt2-summary'), cancel = ToolUI.el('vt2-cancel');
  var lifecycle = ToolUI.el('tool-root')._toolLifecycle;
  var prog = ToolUI.el('vt2-prog'), progLabel = ToolUI.el('vt2-prog-label');
  var file = null;
  var TS = /^\d{1,2}:\d{2}:\d{2}$/;

  function fail(m) { ToolUI.showError(err, m); }
  function clearErr() { ToolUI.clearError(err); }
  function ensureMedia(cb) { if (window.FFmpegMedia) return cb(); ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-wrapper.js', function () { ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-media.js', cb); }); }
  function seconds(value) { var p = value.split(':').map(Number); return p.length === 3 && p.every(Number.isFinite) ? p[0] * 3600 + p[1] * 60 + p[2] : NaN; }
  function stamp(value) { value = Math.max(0, Math.floor(value)); return [Math.floor(value / 3600), Math.floor(value % 3600 / 60), value % 60].map(function (n) { return String(n).padStart(2, '0'); }).join(':'); }
  function syncText() { start.value = stamp(+startRange.value); end.value = stamp(+endRange.value); syncSummary(); }
  function syncRanges() { var a = seconds(start.value), b = seconds(end.value); if (Number.isFinite(a)) startRange.value = a; if (Number.isFinite(b)) endRange.value = b; syncSummary(); }
  function syncSummary() { summary.textContent = start.value + ' → ' + end.value; }
  [startRange, endRange].forEach(function (field) { field.addEventListener('input', syncText); });
  [start, end].forEach(function (field) { field.addEventListener('input', syncRanges); });

  ToolUI.dropzone(drop, {
    accept: ['video/*', '.mp4', '.webm', '.mov', '.mkv', '.avi'], multiple: false, maxSize: 100 * 1024 * 1024,
    onFiles: function (arr) {
      clearErr();
      file = arr[0]; lifecycle.cleanup(); lifecycle = ToolUI.lifecycle(ToolUI.el('tool-root')); ToolUI.el('tool-root')._toolLifecycle = lifecycle;
      preview.src = lifecycle.objectUrl(file); resultPreview.classList.add('hidden');
      preview.onloadedmetadata = function () { var duration = Number.isFinite(preview.duration) ? preview.duration : 0; startRange.max = endRange.max = duration; startRange.value = 0; endRange.value = duration; end.value = stamp(duration); syncSummary(); };
      ToolUI.renderFileList(list, [{ name: file.name, size: file.size }], function () { lifecycle.cleanup(); file = null; preview.removeAttribute('src'); list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = false;
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr();
    if (!TS.test(start.value) || !TS.test(end.value) || seconds(end.value) <= seconds(start.value)) return fail(ToolUI.t('invalid_time'));
    var outExt = FFmpegMedia.ext(file.name) === 'webm' ? 'webm' : 'mp4';
    var outMime = outExt === 'webm' ? 'video/webm' : 'video/mp4';
    run.disabled = true; cancel.classList.remove('hidden'); lifecycle.setState('processing');
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ensureMedia(function () {
      FFmpegMedia.runJob({
        file: file, signal: lifecycle.signal(), inName: 'in.' + FFmpegMedia.ext(file.name), outName: 'out.' + outExt, outMime: outMime,
        args: function (inN, outN) {
          var a = ['-ss', start.value, '-to', end.value, '-i', inN];
          if (reenc.value === '1') a.push('-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac'); else a.push('-c', 'copy');
          a.push(outN);
          return a;
        },
        onProgress: function (p, l) { ToolUI.setProgress(prog, p, l); progLabel.textContent = l; },
        onError: function (m) { prog.classList.add('hidden'); progLabel.classList.add('hidden'); cancel.classList.add('hidden'); run.disabled = false; fail(m); },
        onBlob: function (blob) { resultPreview.src = lifecycle.objectUrl(blob); resultPreview.classList.remove('hidden'); ToolUI.download(blob, 'video-trim.' + outExt); prog.classList.add('hidden'); progLabel.classList.add('hidden'); cancel.classList.add('hidden'); run.disabled = false; }
      });
    });
  });
  cancel.addEventListener('click', function () { lifecycle.abort(); cancel.classList.add('hidden'); prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false; });
})();
