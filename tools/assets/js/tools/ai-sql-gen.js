// AI generátor SQL — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var input = ToolUI.el('sql-input'), dialect = ToolUI.el('sql-dialect');
  var run = ToolUI.el('sql-run'), label = run.querySelector('.sql-label'), stop = run.querySelector('.sql-stop');
  var err = ToolUI.el('sql-error'), errText = ToolUI.el('sql-error-text');
  var out = ToolUI.el('sql-out'), md = ToolUI.el('sql-md'), copy = ToolUI.el('sql-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Popište, co má dotaz dělat.');
    clearErr();
    var prompt = 'Dialekt SQL: ' + dialect.value + '.\n\n' + text;
    out.classList.remove('hidden'); md.textContent = 'Generuji…';
    setRunning(true);
    handle = AITool.run({
      tool: 'ai-sql-gen', prompt: prompt,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();