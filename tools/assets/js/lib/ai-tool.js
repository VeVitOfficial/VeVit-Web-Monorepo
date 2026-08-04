// Sdílený helper AI nástrojů (Dávka 12). Zapouzdřuje volání /tools/api/ai/ollama
// s NDJSON streamem a bezpečné vykreslení přes jediný VeVitMarkdown renderer.
//
// Bezpečnost: system prompt nikdy neposílá klient (posílá jen `tool` identifikátor,
// proxy si prompt dohledá). Uživatelský text jde jako `prompt`.
(function () {
  'use strict';
  if (window.AITool) return;

  // opts: { tool, prompt, model?, images?, stream?=true,
  //         onToken(piece, full), onDone(full), onError(msg) }
  // Vrací { abort() }.
  function run(opts) {
    var controller = new AbortController();
    var full = '';
    var done = false;
    var body = { prompt: opts.prompt, tool: opts.tool, stream: opts.stream !== false };
    if (opts.model) body.model = opts.model;
    if (opts.images && opts.images.length) body.images = opts.images;

    fetch('/tools/api/ai/ollama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (d) {
          throw new Error((d && (d.message || d.error)) || ('HTTP ' + res.status));
        });
      }
      var reader = res.body.getReader();
      var dec = new TextDecoder();
      var buf = '';
      function pump() {
        return reader.read().then(function (ch) {
          if (ch.done) { if (!done) { done = true; opts.onDone && opts.onDone(full); } return; }
          buf += dec.decode(ch.value, { stream: true });
          var lines = buf.split('\n'); buf = lines.pop() || '';
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i]; if (!line.trim()) continue;
            try {
              var p = JSON.parse(line);
              if (p.response || p.text) {
                var piece = p.response || p.text;
                full += piece; opts.onToken && opts.onToken(piece, full);
              }
              if (p.done) { done = true; opts.onDone && opts.onDone(full); return; }
            } catch (e) { /* ignoruj nevalidní řádek */ }
          }
          return pump();
        });
      }
      return pump();
    }).catch(function (e) {
      if (e && e.name === 'AbortError') { if (!done) opts.onDone && opts.onDone(full); return; }
      opts.onError && opts.onError((e && e.message) ? e.message : 'AI není dostupná. Spusťte Ollamu.');
    });
    return { abort: function () { controller.abort(); } };
  }

  // Bezpečné vykreslení markdownu do elementu (DOMPurify sanitize).
  function renderMarkdown(el, text) {
    if (!window.VeVitMarkdown) {
      el.replaceChildren(document.createTextNode('Odpověď nelze bezpečně vykreslit.'));
      el.dataset.renderState = 'error';
      return false;
    }
    return window.VeVitMarkdown.renderInto(el, text);
  }

  // Přečte File jako base64 (bez data URL prefixu) — pro vision obrázky.
  function fileToBase64(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var s = r.result;
      var i = s.indexOf(',');
      cb(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = function () { cb(null); };
    r.readAsDataURL(file);
  }

  window.AITool = { run: run, renderMarkdown: renderMarkdown, fileToBase64: fileToBase64 };
})();
