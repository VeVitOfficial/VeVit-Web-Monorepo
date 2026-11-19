// AI psaní e-mailu — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var input = ToolUI.el('ew-input'), tone = ToolUI.el('ew-tone'), lang = ToolUI.el('ew-lang');
  var run = ToolUI.el('ew-run'), label = run.querySelector('.ew-label'), stop = run.querySelector('.ew-stop');
  var err = ToolUI.el('ew-error'), errText = ToolUI.el('ew-error-text');
  var out = ToolUI.el('ew-out'), md = ToolUI.el('ew-md'), copy = ToolUI.el('ew-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Popište, o jaký e-mail jde.');
    clearErr();
    var prompt = 'Napiš e-mail v jazyce: ' + lang.value + '. Tón: ' + tone.value + '. Zadání:\n\n' + text;
    out.classList.remove('hidden'); md.textContent = 'Píšu e-mail…';
    setRunning(true);
    handle = AITool.run({
      tool: 'ai-email-writer', prompt: prompt,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();