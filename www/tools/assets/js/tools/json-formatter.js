// JSON formátovač
(function () {
  var input = document.getElementById('jf-input');
  var output = document.getElementById('jf-output');
  var error = document.getElementById('jf-error');
  var copyBtn = document.getElementById('jf-copy');
  var icoCopy = copyBtn.querySelector('.ico-copy');
  var icoCheck = copyBtn.querySelector('.ico-check');
  var label = copyBtn.querySelector('.label');

  function showCopied() {
    icoCopy.classList.add('hidden');
    icoCheck.classList.remove('hidden');
    label.textContent = 'Zkopírováno';
    setTimeout(function () {
      icoCopy.classList.remove('hidden');
      icoCheck.classList.add('hidden');
      label.textContent = 'Kopírovat';
    }, 2000);
  }

  function format(minify) {
    var raw = input.value.trim();
    error.classList.add('hidden');
    if (!raw) {
      if (!minify) { error.textContent = 'Vložte JSON k formátování.'; error.classList.remove('hidden'); }
      output.value = '';
      return;
    }
    try {
      var parsed = JSON.parse(raw);
      output.value = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      copyBtn.disabled = false;
    } catch (err) {
      output.value = '';
      error.textContent = 'Neplatný JSON: ' + err.message;
      error.classList.remove('hidden');
    }
  }

  document.getElementById('jf-format').addEventListener('click', function () { format(false); });
  document.getElementById('jf-minify').addEventListener('click', function () { format(true); });
  document.getElementById('jf-clear').addEventListener('click', function () {
    input.value = ''; output.value = ''; error.classList.add('hidden'); copyBtn.disabled = true;
  });

  copyBtn.addEventListener('click', function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      toast.success('Zkopírováno do schránky');
      showCopied();
    });
  });
})();