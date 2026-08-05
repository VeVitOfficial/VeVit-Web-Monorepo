// Sdílený lazy-loaded wrapper pro ffmpeg.wasm (@ffmpeg/ffmpeg 0.12 API).
// ESM build nevyžaduje unsafe-eval a jádro se načítá pouze ze stejného originu.
//
// Vendoorované soubory (task #12) v /assets/js/lib/ffmpeg/:
//   index.js + moduly     — @ffmpeg/ffmpeg@0.12.15 ESM
//   ffmpeg-core.js/.wasm — @ffmpeg/core@0.12.10 ESM
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
  // Povoleno pro mediální nástroje — tools/.htaccess přidává 'wasm-unsafe-eval'
  // do script-src pouze pro těchto 9 stránek. Ostatní stránky mají strikní CSP.
  var ENABLED = true;
  var loadPromise = null;
  var instance = null;
  var progressHandler = null;

  function ready(onProgress) {
    if (typeof onProgress === 'function') progressHandler = onProgress;
    if (loadPromise) return loadPromise;
    loadPromise = import(BASE + 'index.js').then(function (module) {
      if (!module || typeof module.FFmpeg !== 'function') throw new Error('ffmpeg.wasm se nepodařilo načíst.');
      instance = new module.FFmpeg();
      instance.on('progress', function (event) {
        if (progressHandler) progressHandler(event.progress);
      });
      return instance.load({
        coreURL: BASE + 'ffmpeg-core.js',
        wasmURL: BASE + 'ffmpeg-core.wasm'
      }).then(function () { return instance; });
    });
    return loadPromise;
  }

  function write(ffmpeg, name, data) { return Promise.resolve(data).then(function (bytes) { return ffmpeg.writeFile(name, bytes); }); }
  function read(ffmpeg, name) { return ffmpeg.readFile(name); }
  function remove(ffmpeg, name) { return ffmpeg.deleteFile(name).catch(function () {}); }
  function run(ffmpeg, args) {
    return ffmpeg.exec(args).then(function (exitCode) {
      if (exitCode !== 0) throw new Error('ffmpeg skončil s kódem ' + exitCode + '.');
    });
  }
  function fetchFile(file) {
    if (file instanceof Blob) return file.arrayBuffer().then(function (buffer) { return new Uint8Array(buffer); });
    return fetch(file).then(function (response) {
      if (!response.ok) throw new Error('Vstupní soubor nelze načíst.');
      return response.arrayBuffer();
    }).then(function (buffer) { return new Uint8Array(buffer); });
  }

  window.FFmpegWrapper = {
    ready: ready,
    write: write,
    read: read,
    remove: remove,
    run: run,
    fetchFile: fetchFile,
    ENABLED: true,
    LOADING_NOTE: 'Poprvé se načítá ffmpeg.wasm (~32 MB) — může trvat několik sekund. Další nástroje už balíček sdílejí. WASM je pomalejší než nativní ffmpeg; u velkých souborů počítejte s prodlevou.'
  };
})();
