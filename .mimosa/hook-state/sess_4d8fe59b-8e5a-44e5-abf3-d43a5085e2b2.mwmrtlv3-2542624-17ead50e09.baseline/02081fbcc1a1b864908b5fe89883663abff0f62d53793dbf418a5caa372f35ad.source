// Spojení více videí přes ffmpeg.wasm concat demuxer, čistě client-side.
// Požaduje stejný kodek + rozlišení (jinak -c copy selže). Vstupy se do FS zapisují pod pevnými jmény in0.<ext>, in1.<ext>…
(function () {
  'use strict';
  var drop = ToolUI.el('vm-drop'), list = ToolUI.el('vm-list'), work = ToolUI.el('vm-work');
  var fmt = ToolUI.el('vm-format'), run = ToolUI.el('vm-run'), err = ToolUI.el('vm-error');
  var prog = ToolUI.el('vm-prog'), progLabel = ToolUI.el('vm-prog-label');
  var files = [], MAX = 100 * 1024 * 1024;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ext(name) { var m = name.match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : 'mp4'; }
  function ensureMedia(cb) { if (window.FFmpegWrapper) return cb(); ToolUI.loadScript('/tools/assets/js/lib/ffmpeg-wrapper.js', cb); }

  ToolUI.dropzone(drop, {
    accept: ['video/*', '.mp4', '.webm', '.mov', '.mkv', '.avi'], multiple: true,
    onFiles: function (arr) {
      clearErr();
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].size > MAX) return fail('Soubor „' + arr[i].name + '" je příliš velký (max ' + ToolUI.fmtSize(MAX) + ' — limit ffmpeg.wasm).');
        files.push(arr[i]);
      }
      ToolUI.renderFileList(list, files.map(function (f) { return { name: f.name, size: f.size }; }), function (idx) {
        files.splice(idx, 1);
        if (!files.length) { list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; }
      }, { reorder: true, onMove: function (i, dir) { var j = i + dir; if (j < 0 || j >= files.length) return; var t = files[i]; files[i] = files[j]; files[j] = t; } });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = files.length < 2;
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (files.length < 2) return fail('Přidejte alespoň dvě videa.');
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ensureMedia(function () {
      var outExt = fmt.value, outName = 'out.' + outExt, outMime = 'video/' + outExt;
      ToolUI.setProgress(prog, 2, FFmpegWrapper.LOADING_NOTE);
      FFmpegWrapper.ready(function (p) { ToolUI.setProgress(prog, Math.max(5, Math.round((p || 0) * 80)), 'Načítám…'); }).then(function (ff) {
        var inNames = files.map(function (f, i) { return 'in' + i + '.' + ext(f.name); });
        var chain = Promise.resolve();
        inNames.forEach(function (n, i) { chain = chain.then(function () { return FFmpegWrapper.write(ff, n, FFmpegWrapper.fetchFile(files[i])); }); });
        return chain.then(function () {
          // list.txt pro concat demuxer — pevná jména, žádný uživatelský vstup.
          var txt = inNames.map(function (n) { return "file '" + n + "'"; }).join('\n');
          return FFmpegWrapper.write(ff, 'list.txt', new TextEncoder().encode(txt)).then(function () {
            ToolUI.setProgress(prog, 40, 'Spojuji…');
            return FFmpegWrapper.run(ff, ['-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', outName]);
          });
        }).then(function () {
          return FFmpegWrapper.read(ff, outName);
        }).then(function (data) {
          inNames.forEach(function (n) { FFmpegWrapper.remove(ff, n); });
          FFmpegWrapper.remove(ff, 'list.txt'); FFmpegWrapper.remove(ff, outName);
          ToolUI.setProgress(prog, 100, 'Hotovo');
          prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
          ToolUI.download(new Blob([data], { type: outMime }), 'spojeno.' + outExt);
          if (window.toast) toast.success('Videa spojena');
        });
      }).catch(function (e) {
        prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
        fail(e && e.message ? e.message : 'Spojení selhalo — pravděpodobně videa nemají shodný kodek/rozlišení. Zkuste stejný formát nebo převeďte každé zvlášť.');
      });
    });
  });
})();