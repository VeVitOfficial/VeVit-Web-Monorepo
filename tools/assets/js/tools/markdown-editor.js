// Markdown editor — live náhled přes lokální marked + DOMPurify. Autosave do localStorage.
(function () {
  'use strict';
  var input = ToolUI.el('md-input');
  var preview = ToolUI.el('md-preview');
  var KEY = 'vevit:md-editor';
  var renderTimer = null;

  function render() {
    var text = input.value;
    if (!window.VeVitMarkdown) {
      preview.replaceChildren(document.createTextNode('Náhled nelze bezpečně vykreslit.'));
      preview.dataset.renderState = 'error';
      return;
    }
    window.VeVitMarkdown.renderInto(preview, text);
  }

  function schedule() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function () {
      render();
      ToolUI.persist(KEY, input.value);
    }, 150);
  }

  // ── Toolbar: vlož značku kolem výběru ──────────────────────────
  function wrap(prefix, suffix) {
    suffix = suffix || prefix;
    var s = input.selectionStart, e = input.selectionEnd;
    var val = input.value;
    var sel = val.slice(s, e);
    var rep = prefix + (sel || 'text') + suffix;
    input.value = val.slice(0, s) + rep + val.slice(e);
    var caret = s + prefix.length;
    input.setSelectionRange(caret, caret + (sel || 'text').length);
    input.focus();
    schedule();
  }
  function linePrefix(pfx) {
    var s = input.selectionStart;
    var val = input.value;
    var lineStart = val.lastIndexOf('\n', s - 1) + 1;
    input.value = val.slice(0, lineStart) + pfx + val.slice(lineStart);
    input.setSelectionRange(s + pfx.length, s + pfx.length);
    input.focus();
    schedule();
  }

  var ACTIONS = {
    bold: function () { wrap('**'); },
    italic: function () { wrap('*'); },
    h1: function () { linePrefix('# '); },
    h2: function () { linePrefix('## '); },
    quote: function () { linePrefix('> '); },
    code: function () { wrap('`'); },
    link: function () { wrap('[', '](https://)'); },
    list: function () { linePrefix('- '); }
  };

  document.querySelectorAll('[data-md]').forEach(function (b) {
    b.addEventListener('click', function () { ACTIONS[b.dataset.md](); });
  });

  // Klávesové zkratky Ctrl+B / Ctrl+I.
  input.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); ACTIONS.bold(); }
      else if (e.key === 'i' || e.key === 'I') { e.preventDefault(); ACTIONS.italic(); }
    }
  });

  input.addEventListener('input', schedule);

  // Exporty.
  ToolUI.el('md-export-md').addEventListener('click', function () {
    if (!input.value) return;
    ToolUI.download(new Blob([input.value], { type: 'text/markdown;charset=utf-8' }), 'dokument.md');
  });
  ToolUI.el('md-export-html').addEventListener('click', function () {
    if (!input.value) return;
    var body = preview.innerHTML;
    var html = '<!DOCTYPE html><html lang="cs"><head><meta charset="utf-8"><title>Dokument</title><style>body{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#111}pre{background:#f4f4f5;padding:1rem;border-radius:.5rem;overflow:auto}code{background:#f4f4f5;padding:.125rem .375rem;border-radius:.25rem}</style></head><body>' + body + '</body></html>';
    ToolUI.download(new Blob([html], { type: 'text/html;charset=utf-8' }), 'dokument.html');
  });
  ToolUI.el('md-clear').addEventListener('click', function () {
    input.value = ''; render(); ToolUI.persist(KEY, '');
    input.focus();
  });

  // Obnova z localStorage.
  input.value = ToolUI.restore(KEY, '');
  render();
})();
