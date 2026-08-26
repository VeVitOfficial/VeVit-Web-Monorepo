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
  var entropyEl = document.getElementById('pw-entropy');
  var mode = document.getElementById('pw-mode');
  var ambiguous = document.getElementById('pw-ambiguous');
  var root = document.getElementById('pw-root');

  var LABELS = ['strength_very_weak', 'strength_weak', 'strength_medium', 'strength_strong', 'strength_very_strong'].map(ToolUI.t);
  var COLORS = ['#ef4444', '#f97316', '#eab308', '#10b981', '#34d399'];
  var WORDS = ['amber','apple','atlas','bamboo','beacon','birch','breeze','cedar','cloud','comet','coral','delta','ember','falcon','fern','forest','harbor','hazel','island','juniper','lantern','maple','meadow','meteor','mint','ocean','olive','orchid','pebble','pine','planet','river','robin','silver','solar','spruce','stone','sunset','timber','violet','willow'];

  function randomIndex(max) {
    var limit = Math.floor(0x100000000 / max) * max, value;
    do { var data = new Uint32Array(1); crypto.getRandomValues(data); value = data[0]; } while (value >= limit);
    return value % max;
  }

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
    if (mode.value === 'words') {
      var words = []; for (var w = 0; w < 5; w++) words.push(WORDS[randomIndex(WORDS.length)]);
      out.value = words.join('-'); copyBtn.disabled = false;
      showStrength(Math.round(5 * Math.log2(WORDS.length)), 4); return;
    }
    var chars = '';
    if (lower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (upper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numbers.checked) chars += '0123456789';
    if (symbols.checked) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    if (ambiguous.checked) chars = chars.replace(/[0O1lI]/g, '');
    if (!chars) { toast.error(ToolUI.t('choose_charset')); return; }
    var len = parseInt(lengthEl.value, 10);
    var result = '';
    for (var i = 0; i < len; i++) result += chars[randomIndex(chars.length)];
    out.value = result;
    copyBtn.disabled = false;

    var s = Math.min(4, getStrength()); showStrength(Math.round(len * Math.log2(chars.length)), s);
  }

  function showStrength(bits, s) {
    strengthLabel.textContent = LABELS[s];
    strengthBar.style.width = ((s + 1) * 20) + '%';
    strengthBar.style.background = COLORS[s] || '#6b7280';
    strengthWrap.classList.remove('hidden');
    entropyEl.textContent = root.dataset.entropyLabel.replace('{bits}', bits);
  }

  lengthEl.addEventListener('input', function () { lenLabel.textContent = lengthEl.value; });
  genBtn.addEventListener('click', generate);
  mode.addEventListener('change', function () { document.querySelector('.pw-options').classList.toggle('is-passphrase', mode.value === 'words'); });

  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    var v = out.value;
    navigator.clipboard.writeText(v).then(function () {
      toast.success(ToolUI.t('password_copied'));
      Icon.flashCopied(copyBtn, null, '', '');
    });
  });
})();
