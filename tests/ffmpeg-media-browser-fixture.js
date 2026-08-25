// Manuální funkční test pro ffmpeg.wasm mediální nástroje.
// Otevřete v prohlížeči přes http://127.0.0.1:18765/tests/ffmpeg-media-browser-fixture.html
// (spusťte php -S 127.0.0.1:18765 -t . z kořene repozitáře).
// Automatizovaný CI test (ffmpeg-csp-browser-test.sh) ověřuje pouze CSP;
// načtení 32MB WASM souboru je příliš pomalé pro --dump-dom --virtual-time-budget.

(function () {
  'use strict';

  function log(msg, ok) {
    var p = document.createElement('p');
    p.style.cssText = 'font-family:monospace;font-size:13px;margin:4px 0;color:' + (ok === false ? '#c00' : ok === true ? '#080' : '#555');
    p.textContent = msg;
    document.body.appendChild(p);
  }

  // Minimal valid WAV: 44-byte header + 100 bytes of silence at 8 kHz mono 16-bit
  function makeWav() {
    var pcm = 100;
    var buf = new ArrayBuffer(44 + pcm);
    var v = new DataView(buf);
    var s = function (off, str) { for (var i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i)); };
    s(0, 'RIFF'); v.setUint32(4, 36 + pcm, true);
    s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    s(36, 'data'); v.setUint32(40, pcm, true);
    return new Blob([buf], { type: 'audio/wav' });
  }

  document.body.style.cssText = 'font-family:sans-serif;padding:1rem;max-width:600px';
  document.body.dataset.status = 'running';
  log('FFmpegWrapper.ENABLED: ' + window.FFmpegWrapper.ENABLED, window.FFmpegWrapper.ENABLED === true);

  if (!window.FFmpegWrapper.ENABLED) {
    log('FAIL: wrapper je vypnutý (ENABLED=false)', false);
    document.body.dataset.status = 'fail';
    return;
  }

  log('Načítám ffmpeg.wasm (~32 MB) — může trvat 10–30 s...');
  document.body.dataset.audio = 'loading';

  window.FFmpegWrapper.ready().then(function (ff) {
    log('ffmpeg.wasm načten OK', true);
    var wav = makeWav();
    return window.FFmpegWrapper.write(ff, 'in.wav', window.FFmpegWrapper.fetchFile(wav)).then(function () {
      return window.FFmpegWrapper.run(ff, ['-i', 'in.wav', '-ar', '8000', '-ac', '1', '-b:a', '8k', 'out.mp3']);
    }).then(function () {
      return window.FFmpegWrapper.read(ff, 'out.mp3');
    }).then(function (data) {
      window.FFmpegWrapper.remove(ff, 'in.wav');
      window.FFmpegWrapper.remove(ff, 'out.mp3');
      if (!data || data.length < 10) throw new Error('Výstupní soubor je prázdný nebo příliš malý (' + (data ? data.length : 0) + ' B).');
      log('Audio WAV→MP3 OK, výstup ' + data.length + ' B', true);
      document.body.dataset.audio = 'ok';
      document.body.dataset.status = 'pass';
    });
  }).catch(function (e) {
    log('FAIL: ' + (e && e.message ? e.message : String(e)), false);
    document.body.dataset.audio = 'fail';
    document.body.dataset.status = 'fail';
  });
})();
