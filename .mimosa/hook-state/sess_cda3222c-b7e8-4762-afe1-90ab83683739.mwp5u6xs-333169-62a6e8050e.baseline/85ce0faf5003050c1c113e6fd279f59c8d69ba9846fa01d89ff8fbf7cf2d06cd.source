// AI vysvětlení kódu — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var input = ToolUI.el('ce-input');
  var run = ToolUI.el('ce-run'), label = run.querySelector('.ce-label'), stop = run.querySelector('.ce-stop');
  var err = ToolUI.el('ce-error'), errText = ToolUI.el('ce-error-text');
  var out = ToolUI.el('ce-out'), md = ToolUI.el('ce-md'), copy = ToolUI.el('ce-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Vložte kód k vysvětlení.');
    clearErr();
    out.classList.remove('hidden'); md.textContent = 'Analyzuji…';
    setRunning(true);
    handle = AITool.run({
      tool: 'ai-code-explainer', prompt: text,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();