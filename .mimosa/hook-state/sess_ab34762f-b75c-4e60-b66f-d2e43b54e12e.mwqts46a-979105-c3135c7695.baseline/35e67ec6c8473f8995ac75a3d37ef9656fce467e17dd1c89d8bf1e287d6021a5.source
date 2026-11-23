// Hash generátor — MD5 (vestavěná impl) + SHA-256/512 (SubtleCrypto, async).
(function () {
  var input = document.getElementById('hash-input');
  var typeSel = document.getElementById('hash-type');
  var computeBtn = document.getElementById('hash-compute');
  var wrap = document.getElementById('hash-result-wrap');
  var result = document.getElementById('hash-result');
  var copyBtn = document.getElementById('hash-copy');

  function setDisabled(b) { copyBtn.disabled = b; }

  async function sha(algo, text) {
    var data = new TextEncoder().encode(text);
    var buf = await crypto.subtle.digest(algo, data);
    var bytes = Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); });
    return bytes.join('');
  }

  async function compute() {
    var text = input.value;
    if (!text) { wrap.classList.add('hidden'); result.value = ''; setDisabled(true); return; }
    var type = typeSel.value;
    var hash;
    try {
      if (type === 'md5') hash = window.md5(text);
      else if (type === 'sha256') hash = await sha('SHA-256', text);
      else hash = await sha('SHA-512', text);
    } catch (e) {
      toast.error('Hash se nepodařilo spočítat');
      return;
    }
    result.value = hash;
    wrap.classList.remove('hidden');
    setDisabled(false);
  }

  computeBtn.addEventListener('click', compute);

  copyBtn.addEventListener('click', function () {
    if (!result.value) return;
    var btn = copyBtn;
    navigator.clipboard.writeText(result.value).then(function () {
      toast.success('Hash zkopírován');
      Icon.flashCopied(btn, null, '', '');
    });
  });
})();