// Sdílený helper pro ffmpeg.wasm media nástroje (Dávka 11).
// Zapouzdřuje běžný tok: načtení ffmpeg, zápis vstupu, spuštění args, čtení výstupu, cleanup.
// Nepřijímá uživatelské názvy souborů jako ffmpeg argumenty — v FS se používají pevná jména.
(function () {
  'use strict';
  if (window.FFmpegMedia) return;

  var MAX = 100 * 1024 * 1024; // limit pro ffmpeg.wasm

  function ext(name) { var m = String(name).match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : 'bin'; }

  // job: { file, args(inName,outName) => [args], outName, outMime, outExt, onProgress(p, label), onError(msg), onDone(), maxBytes }
  function runJob(job) {
    var onProgress = job.onProgress || function () {};
    var onError = job.onError || function (m) { console.error(m); };
    if (job.file.size > (job.maxBytes || MAX)) return onError('Soubor je příliš velký (max ' + ToolUI.fmtSize(job.maxBytes || MAX) + ' — limit ffmpeg.wasm).');
    onProgress(2, FFmpegWrapper.LOADING_NOTE);
    var inName = job.inName || ('in.' + ext(job.file.name));
    FFmpegWrapper.ready(function (p) { onProgress(Math.max(5, Math.round((p || 0) * 85)), 'Zpracovávám…'); }).then(function (ff) {
      return FFmpegWrapper.write(ff, inName, FFmpegWrapper.fetchFile(job.file)).then(function () {
        var args = typeof job.args === 'function' ? job.args(inName, job.outName) : job.args;
        onProgress(30, job.runLabel || 'Zpracovávám (může trvat)…');
        return FFmpegWrapper.run(ff, args).then(function () {
          return FFmpegWrapper.read(ff, job.outName).then(function (data) {
            FFmpegWrapper.remove(ff, inName); FFmpegWrapper.remove(ff, job.outName);
            job.onDone && job.onDone(data);
            return new Blob([data], { type: job.outMime || 'application/octet-stream' });
          });
        });
      }).then(function (blob) {
        onProgress(100, 'Hotovo');
        job.onBlob && job.onBlob(blob);
      });
    }).catch(function (e) { onError(e && e.message ? e.message : 'Zpracování selhalo (možná nepodporovaný kodek ve ffmpeg.wasm).'); });
  }

  // merge: více stejných souborů přes concat demuxer
  function runMerge(files, args, outName, outMime, outExt, onProgress, onError, onBlob, onDone) {
    onProgress(2, FFmpegWrapper.LOADING_NOTE);
    var inputs = files.map(function (f, i) { return { name: 'in' + i + '.' + ext(f.name), file: f }; });
    FFmpegWrapper.ready(function (p) { onProgress(Math.max(5, Math.round((p || 0) * 80)), 'Zpracovávám…'); }).then(function (ff) {
      var chain = Promise.resolve();
      inputs.forEach(function (inp) { chain = chain.then(function () { return FFmpegWrapper.write(ff, inp.name, FFmpegWrapper.fetchFile(inp.file)); }); });
      return chain.then(function () {
        onProgress(35, 'Spojuji…');
        return FFmpegWrapper.run(ff, args).then(function () {
          return FFmpegWrapper.read(ff, outName).then(function (data) {
            inputs.forEach(function (inp) { FFmpegWrapper.remove(ff, inp.name); });
            FFmpegWrapper.remove(ff, outName);
            onDone && onDone(data);
            return new Blob([data], { type: outMime });
          });
        });
      }).then(function (blob) { onProgress(100, 'Hotovo'); onBlob && onBlob(blob); });
    }).catch(function (e) { onError(e && e.message ? e.message : 'Spojení selhalo.'); });
  }

  window.FFmpegMedia = { runJob: runJob, runMerge: runMerge, MAX: MAX, ext: ext };
})();