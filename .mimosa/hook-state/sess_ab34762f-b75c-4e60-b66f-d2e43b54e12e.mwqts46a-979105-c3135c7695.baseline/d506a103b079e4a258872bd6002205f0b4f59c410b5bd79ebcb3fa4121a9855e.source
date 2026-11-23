// URL kodér/dekodér (percent encoding), čistě client-side.
(function () {
  'use strict';
  var seg = ToolUI.el('ue-mode'), inEl = ToolUI.el('ue-in'), out = ToolUI.el('ue-out');
  var copyBtn = ToolUI.el('ue-copy'), swapBtn = ToolUI.el('ue-swap'), err = ToolUI.el('ue-error');
  var mode = 'enc';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent=''; }

  function compute() {
    clearErr();
    if (!inEl.value) { out.value=''; copyBtn.disabled=true; return; }
    try {
      out.value = mode === 'enc' ? encodeURIComponent(inEl.value) : decodeURIComponent(inEl.value);
    } catch (e) { out.value=''; fail('Neplatný vstup pro dekódování (špatná sekvence %).'); }
    copyBtn.disabled = !out.value;
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x===b; x.classList.toggle('active',on); x.setAttribute('aria-selected', on?'true':'false');
    });
    compute();
  });

  inEl.addEventListener('input', compute);
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function(){ if(window.toast) toast.success('Zkopírováno'); });
  });
  swapBtn.addEventListener('click', function () {
    inEl.value = out.value;
    // přepni režim a přepočti
    var other = mode === 'enc' ? 'dec' : 'enc';
    var btn = seg.querySelector('button[data-mode="'+other+'"]'); if (btn) btn.click();
  });
})();