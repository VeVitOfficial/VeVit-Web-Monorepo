// AI SEO meta generátor — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var input = ToolUI.el('seo-input');
  var run = ToolUI.el('seo-run'), label = run.querySelector('.seo-label'), stop = run.querySelector('.seo-stop');
  var err = ToolUI.el('seo-error'), errText = ToolUI.el('seo-error-text');
  var out = ToolUI.el('seo-out'), md = ToolUI.el('seo-md'), copy = ToolUI.el('seo-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Vložte obsah nebo klíčová slova.');
    clearErr();
    out.classList.remove('hidden'); md.textContent = 'Generuji…';
    setRunning(true);
    handle = AITool.run({
      tool: 'ai-seo', prompt: text,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();