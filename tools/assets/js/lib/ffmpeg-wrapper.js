// Sdílený lazy-loaded wrapper pro ffmpeg.wasm (@ffmpeg/ffmpeg 0.11 API).
// Jediný načtený ~24 MB WASM balíček napříč všemi nástroji kategorie Média (Dávka 11).
//
// Vendoorované soubory (task #12) v /assets/js/lib/ffmpeg/:
//   ffmpeg.js             — @ffmpeg/ffmpeg@0.11.6 UMD (window.FFmpeg: createFFmpeg, fetchFile)
//   ffmpeg-core.js        — @ffmpeg/core@0.11.0
//   ffmpeg-core.wasm      — jádro (24 MB)
//   ffmpeg-core.worker.js — worker (ffmpeg-core.js si ho načte sám ze stejné složky)
//
// Použití:
//   FFmpegWrapper.ready().then(function(ffmpeg){ ... FFmpegWrapper.run(ffmpeg, ['-i','in','out']) ... })
//
// Bezpečnost: wrapper nikdy nespojuje argumenty do jednoho shell řetězce — vždy
// předáváme pole argumentů (žádné injekce). Uživatelské názvy souborů se nepoužijí
// jako ffmpeg argumenty; do FS zapisujeme pod pevnými jmény (in.<ext>, out.<ext>).
(function () {
  'use strict';
  if (window.FFmpegWrapper) return;

  var BASE = '/tools/assets/js/lib/ffmpeg/';
  var loadPromise = null;
  var instance = null;

  function ready(onProgress) {
    if (loadPromise) return loadPromise;
    loadPromise = ToolUI.loadScript(BASE + 'ffmpeg.js').then(function () {
      var FF = window.FFmpeg;
      if (!FF || !FF.createFFmpeg) throw new Error('ffmpeg.wasm se nepodařilo načíst (chybí window.FFmpeg).');
      var opts = { corePath: BASE + 'ffmpeg-core.js', log: false };
      if (typeof onProgress === 'function') opts.progress = onProgress;
      instance = FF.createFFmpeg(opts);
      return instance.load().then(function () { return instance; });
    });
    return loadPromise;
  }

  function write(ffmpeg, name, data) { return Promise.resolve(ffmpeg.FS('writeFile', name, data)); }
  function read(ffmpeg, name) { return Promise.resolve(ffmpeg.FS('readFile', name)); }
  function remove(ffmpeg, name) { try { ffmpeg.FS('unlink', name); } catch (e) {} return Promise.resolve(); }
  function run(ffmpeg, args) { return Promise.resolve(ffmpeg.run.apply(ffmpeg, args)); }
  function fetchFile(file) { return window.FFmpeg.fetchFile(file); }

  window.FFmpegWrapper = {
    ready: ready,
    write: write,
    read: read,
    remove: remove,
    run: run,
    fetchFile: fetchFile,
    LOADING_NOTE: 'Poprvé se načítá ffmpeg.wasm (~24 MB) — může trvat několik sekund. Další nástroje už balíček sdílejí. WASM je pomalejší než nativní ffmpeg; u velkých souborů počítejte s prodlevou.'
  };
})();