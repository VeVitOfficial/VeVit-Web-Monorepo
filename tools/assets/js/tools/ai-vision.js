// AI analýza obrázku (llava) — obrázek jako base64 + otázka na /api/ai/ollama.
(function () {
  'use strict';
  var drop = ToolUI.el('vis-drop'), list = ToolUI.el('vis-list'), work = ToolUI.el('vis-work');
  var q = ToolUI.el('vis-q');
  var run = ToolUI.el('vis-run'), label = run.querySelector('.vis-label'), stop = run.querySelector('.vis-stop');
  var err = ToolUI.el('vis-error'), errText = ToolUI.el('vis-error-text');
  var out = ToolUI.el('vis-out'), md = ToolUI.el('vis-md'), copy = ToolUI.el('vis-copy');
  var file = null, MAX = 8 * 1024 * 1024;
  var handle = null;

  function fail(m) { errText.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); }
  function setRunning(b) { run.disabled = b; label.classList.toggle('hidden', b); stop.classList.toggle('hidden', !b); }

  ToolUI.dropzone(drop, {
    accept: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > MAX) return fail('Obrázek je příliš velký (max 8 MB).');
      file = f;
      ToolUI.renderFileList(list, [{ name: f.name, size: f.size }], function () { file = null; list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true; });
      list.classList.remove('hidden'); work.classList.remove('hidden'); run.disabled = false;
    },
    onError: fail
  });

  function go() {
    if (handle) { handle.abort(); handle = null; setRunning(false); return; }
    if (!file) return fail('Přidejte obrázek.');
    clearErr();
    setRunning(true);
    out.classList.remove('hidden'); md.textContent = 'Analyzuji obrázek…';
    AITool.fileToBase64(file, function (b64) {
      if (!b64) { setRunning(false); return fail('Obrázek se nepodařilo načíst.'); }
      var question = q.value.trim() || 'Popiš tento obrázek.';
      handle = AITool.run({
        tool: 'ai-vision', model: 'llava', prompt: question, images: [b64],
        onToken: function (piece, full) { AITool.renderMarkdown(md, full); },
        onDone: function (full) { setRunning(false); handle = null; if (!full) md.textContent = ''; },
        onError: function (m) { setRunning(false); handle = null; out.classList.add('hidden'); fail(m); }
      });
    });
  }

  run.addEventListener('click', go);
  copy.addEventListener('click', function () { ToolUI.copyText(md.innerText || md.textContent); });
})();