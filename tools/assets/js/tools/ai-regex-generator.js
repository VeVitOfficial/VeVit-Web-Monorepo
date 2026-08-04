// AI generátor regexu — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var input = ToolUI.el('rg-input');
  var run = ToolUI.el('rg-run'), label = run.querySelector('.rg-label'), stop = run.querySelector('.rg-stop');
  var err = ToolUI.el('rg-error'), errText = ToolUI.el('rg-error-text');
  var out = ToolUI.el('rg-out'), md = ToolUI.el('rg-md'), copy = ToolUI.el('rg-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Popište, co má regex matchovat.');
    clearErr();
    out.classList.remove('hidden'); md.textContent = 'Generuji…';
    setRunning(true);
    handle = AITool.run({
      tool: 'ai-regex-generator', prompt: text,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();