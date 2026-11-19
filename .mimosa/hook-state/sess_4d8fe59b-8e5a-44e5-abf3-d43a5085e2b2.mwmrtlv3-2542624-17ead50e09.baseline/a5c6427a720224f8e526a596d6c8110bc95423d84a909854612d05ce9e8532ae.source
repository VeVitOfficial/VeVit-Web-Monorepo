// AI otázky nad textem (kontext Q&A) — jeden dotaz na /api/ai/ollama.
(function () {
  'use strict';
  var ctx = ToolUI.el('qa-ctx'), q = ToolUI.el('qa-q');
  var run = ToolUI.el('qa-run'), label = run.querySelector('.qa-label'), stop = run.querySelector('.qa-stop');
  var err = ToolUI.el('qa-error'), errText = ToolUI.el('qa-error-text');
  var out = ToolUI.el('qa-out'), md = ToolUI.el('qa-md'), copy = ToolUI.el('qa-copy');
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    var context = ctx.value.trim(), question = q.value.trim();
    if (!context) return fail('Vložte kontext (text).');
    if (!question) return fail('Napište otázku.');
    clearErr();
    var prompt = 'KONTEXT:\n' + context + '\n\nOTÁZKA:\n' + question;
    out.classList.remove('hidden'); md.textContent = 'Přemýšlím…';
    setRunning(true);
    handle = AITool.run({
      tool: 'ai-text-qa', prompt: prompt,
      onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
      onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
      onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();