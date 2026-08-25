// Password generátor — crypto.getRandomValues + ukazatel síly.
(function () {
  var out = document.getElementById('pw-out');
  var copyBtn = document.getElementById('pw-copy');
  var lengthEl = document.getElementById('pw-length');
  var lenLabel = document.getElementById('pw-len-label');
  var lower = document.getElementById('pw-lower');
  var upper = document.getElementById('pw-upper');
  var numbers = document.getElementById('pw-numbers');
  var symbols = document.getElementById('pw-symbols');
  var genBtn = document.getElementById('pw-generate');
  var strengthWrap = document.getElementById('pw-strength-wrap');
  var strengthLabel = document.getElementById('pw-strength-label');
  var strengthBar = document.getElementById('pw-strength-bar');

  var LABELS = ['Velmi slabé', 'Slabé', 'Průměrné', 'Silné', 'Velmi silné'];
  var COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981', '#34d399'];

  function getStrength() {
    var len = parseInt(lengthEl.value, 10);
    var score = 0;
    if (len >= 8) score++;
    if (len >= 12) score++;
    if (lower.checked && upper.checked) score++;
    if (numbers.checked) score++;
    if (symbols.checked) score++;
    return score;
  }

  function generate() {
    var chars = '';
    if (lower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (upper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers.checked) chars += '0123456789';
    if (symbols.checked) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    if (!chars) { toast.error('Vyberte alespoň jednu skupinu znaků'); return; }
    var len = parseInt(lengthEl.value, 10);
    var array = new Uint32Array(len);
    crypto.getRandomValues(array);
    var result = '';
    for (var i = 0; i < len; i++) result += chars[array[i] % chars.length];
    out.value = result;
    copyBtn.disabled = false;

    var s = getStrength();
    strengthLabel.textContent = LABELS[s] || 'Neznámé';
    strengthBar.style.width = ((s + 1) * 20) + '%';
    strengthBar.style.background = COLORS[s] || '#6b7280';
    strengthWrap.classList.remove('hidden');
  }

  lengthEl.addEventListener('input', function () { lenLabel.textContent = lengthEl.value; });
  genBtn.addEventListener('click', generate);

  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    var v = out.value;
    navigator.clipboard.writeText(v).then(function () {
      toast.success('Heslo zkopírováno');
      Icon.flashCopied(copyBtn, null, '', '');
    });
  });
})();