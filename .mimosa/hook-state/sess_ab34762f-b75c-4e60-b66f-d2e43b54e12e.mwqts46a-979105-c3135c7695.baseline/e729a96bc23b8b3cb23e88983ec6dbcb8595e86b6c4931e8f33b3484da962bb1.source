// Konverze videa přes ffmpeg.wasm, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('vc-drop'), list = ToolUI.el('vc-list'), work = ToolUI.el('vc-work');
  var fmt = ToolUI.el('vc-format'), run = ToolUI.el('vc-run'), err = ToolUI.el('vc-error');
  var prog = ToolUI.el('vc-prog'), progLabel = ToolUI.el('vc-prog-label');
  var file = null, MAX = 100 * 1024 * 1024;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ext(name) { var m = name.match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : 'mp4'; }

  ToolUI.dropzone(drop, {
    accept: ['video/*', '.mp4', '.webm', '.mov', '.mkv', '.avi', '.ogv'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > MAX) return fail('Video je příliš velké (max ' + ToolUI.fmtSize(MAX) + ' — limit ffmpeg.wasm).');
      file = f;
      ToolUI.renderFileList(list, [{ name: f.name, size: f.size }], function () { file = null; list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = false;
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 2, FFmpegWrapper.LOADING_NOTE);
    FFmpegWrapper.ready(function (p) { ToolUI.setProgress(prog, Math.max(5, Math.round((p || 0) * 90)), 'Zpracovávám…'); }).then(function (ff) {
      var inName = 'in.' + ext(file.name), outName = 'out.' + fmt.value;
      return FFmpegWrapper.write(ff, inName, FFmpegWrapper.fetchFile(file)).then(function () {
        var args = ['-i', inName];
        if (fmt.value === 'mp4') args.push('-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart');
        else args.push('-c:v', 'libvpx', '-b:v', '1M', '-c:a', 'libvorbis');
        args.push(outName);
        ToolUI.setProgress(prog, 30, 'Převádím (může trvat)…');
        return FFmpegWrapper.run(ff, args).then(function () {
          return FFmpegWrapper.read(ff, outName);
        }).then(function (data) {
          FFmpegWrapper.remove(ff, inName); FFmpegWrapper.remove(ff, outName);
          ToolUI.setProgress(prog, 100, 'Hotovo');
          prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
          ToolUI.download(new Blob([data], { type: 'video/' + fmt.value }), 'prevedeno.' + fmt.value);
          if (window.toast) toast.success('Video převedeno');
        });
      });
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      fail(e && e.message ? e.message : 'Převod selhal (možná nepodporovaný kodek ve ffmpeg.wasm).');
    });
  });
})();