// AI shrnutí textu — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var input = ToolUI.el('ts-input'), style = ToolUI.el('ts-style');
  var run = ToolUI.el('ts-run'), label = run.querySelector('.ts-label'), stop = run.querySelector('.ts-stop');
  var err = ToolUI.el('ts-error'), errText = ToolUI.el('ts-error-text');
  var out = ToolUI.el('ts-out'), md = ToolUI.el('ts-md'), copy = ToolUI.el('ts-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Vložte text ke shrnutí.');
    clearErr();
    var prompt = 'Shrň následující text. Výstup ve formě: ' + style.value + '.\n\n' + text;
    out.classList.remove('hidden'); md.textContent = 'Shrnuji…';
    setRunning(true);
    handle = AITool.run({
      tool: 'summarize-text', prompt: prompt,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();