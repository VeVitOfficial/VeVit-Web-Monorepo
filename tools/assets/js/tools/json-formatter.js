// JSON formátovač
(function () {
  'use strict';
  var input = document.getElementById('jf-input');
  var output = document.getElementById('jf-output');
  var error = document.getElementById('jf-error');
  var copyBtn = document.getElementById('jf-copy');
  var downloadBtn = document.getElementById('jf-download');
  var inputMeta = document.getElementById('jf-input-meta');
  var outputMeta = document.getElementById('jf-output-meta');
  var lifecycle = document.getElementById('tool-root')._toolLifecycle;

  function bytes(value) { return new Blob([value]).size; }
  function cursorMeta(field) {
    var before = field.value.slice(0, field.selectionStart || 0).split('\n');
    return ToolUI.fmtSize(bytes(field.value)) + ' · ' + before.length + ':' + (before[before.length - 1].length + 1);
  }
  function updateMeta() {
    inputMeta.textContent = cursorMeta(input);
    outputMeta.textContent = ToolUI.fmtSize(bytes(output.value)) + ' · ' + (output.value ? output.value.split('\n').length : 1) + ':1';
  }

  function format(minify) {
    var raw = input.value.trim();
    ToolUI.clearError(error);
    if (!raw) {
      if (!minify) ToolUI.showError(error, ToolUI.t('enter_json'));
      output.value = '';
      copyBtn.disabled = downloadBtn.disabled = true;
      updateMeta();
      return;
    }
    try {
      var parsed = JSON.parse(raw);
      output.value = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      copyBtn.disabled = downloadBtn.disabled = false;
      lifecycle.setState('success');
    } catch (err) {
      output.value = '';
      copyBtn.disabled = downloadBtn.disabled = true;
      ToolUI.showError(error, ToolUI.t('invalid_json', { message: err.message }));
    }
    updateMeta();
  }

  document.getElementById('jf-format').addEventListener('click', function () { format(false); });
  document.getElementById('jf-minify').addEventListener('click', function () { format(true); });
  document.getElementById('jf-clear').addEventListener('click', function () {
    input.value = ''; output.value = ''; ToolUI.clearError(error); copyBtn.disabled = downloadBtn.disabled = true;
    lifecycle.setState('idle'); updateMeta(); input.focus();
  });
  ToolUI.wireCopy(copyBtn, function () { return output.value; });
  downloadBtn.addEventListener('click', function () {
    if (output.value) ToolUI.download(new Blob([output.value], { type: 'application/json' }), 'formatted.json');
  });
  ['input', 'keyup', 'click'].forEach(function (eventName) { input.addEventListener(eventName, updateMeta); });
  input.addEventListener('input', function () { lifecycle.setState(input.value.trim() ? 'ready' : 'idle'); });
  updateMeta();
})();
