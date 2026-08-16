// AI překladač — jeden dotaz na /api/ai/ollama, výstup přes DOMPurify+marked.
(function () {
  'use strict';
  var input = ToolUI.el('tt-input'), src = ToolUI.el('tt-src'), tgt = ToolUI.el('tt-tgt');
  var run = ToolUI.el('tt-run'), label = ToolUI.el('tt-label') || run.querySelector('.tt-label');
  var stop = run.querySelector('.tt-stop');
  var err = ToolUI.el('tt-error'), errText = ToolUI.el('tt-error-text');
  var out = ToolUI.el('tt-out'), md = ToolUI.el('tt-md'), copy = ToolUI.el('tt-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; if (label) label.classList.toggle('hidden', b); if (stop) stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var text = input.value.trim();
    if (!text) return fail('Vložte text k překladu.');
    clearErr();
    var prompt = 'Přelož následující text do jazyka „' + tgt.value + '".';
    if (src.value !== 'auto') prompt += ' Z jazyka „' + src.value + '".';
    prompt += '\n\n' + text;
    out.classList.remove('hidden'); md.textContent = 'Překládám…';
    setRunning(true);
    handle = AITool.run({
      tool: 'translate', prompt: prompt,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();