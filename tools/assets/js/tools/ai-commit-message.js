// AI commit zpráva z diffu — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var input = ToolUI.el('cm-input');
  var run = ToolUI.el('cm-run'), label = run.querySelector('.cm-label'), stop = run.querySelector('.cm-stop');
  var err = ToolUI.el('cm-error'), errText = ToolUI.el('cm-error-text');
  var out = ToolUI.el('cm-out'), md = ToolUI.el('cm-md'), copy = ToolUI.el('cm-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Vložte diff nebo seznam změn.');
    clearErr();
    out.classList.remove('hidden'); md.textContent = 'Generuji…';
    setRunning(true);
    handle = AITool.run({
      tool: 'ai-commit-message', prompt: text,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();