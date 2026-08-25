// Base64 kodér/dekodér (text + soubor), čistě client-side.
(function () {
  'use strict';
  var seg = ToolUI.el('b64-mode'), textWrap = ToolUI.el('b64-text'), fileWrap = ToolUI.el('b64-file');
  var inEl = ToolUI.el('b64-in'), inLabel = ToolUI.el('b64-in-label');
  var out = ToolUI.el('b64-out'), copyBtn = ToolUI.el('b64-copy'), clearBtn = ToolUI.el('b64-clear');
  var err = ToolUI.el('b64-error');
  var mode = 'enc';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent=''; }

  // UTF-8 safe base64
  function encodeB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = ''; for (var i=0;i<bytes.length;i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function decodeB64(str) {
    var bin = atob(str.trim());
    var bytes = new Uint8Array(bin.length);
    for (var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function compute() {
    clearErr();
    if (mode === 'file') return;
    try {
      if (mode === 'enc') {
        out.value = inEl.value ? encodeB64(inEl.value) : '';
      } else {
        out.value = inEl.value.trim() ? decodeB64(inEl.value) : '';
      }
    } catch (e) { out.value=''; fail('Neplatný Base64 vstup.'); }
    copyBtn.disabled = !out.value;
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]'); if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(seg.querySelectorAll('button'), function (x) {
      var on = x===b; x.classList.toggle('active',on); x.setAttribute('aria-selected', on?'true':'false');
    });
    textWrap.classList.toggle('hidden', mode==='file');
    fileWrap.classList.toggle('hidden', mode!=='file');
    if (mode === 'enc') inLabel.textContent = 'Vstup (text)';
    else if (mode === 'dec') inLabel.textContent = 'Vstup (Base64)';
    clearErr(); out.value=''; copyBtn.disabled = true;
  });

  ToolUI.dropzone(ToolUI.el('b64-drop'), {
    accept: [], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var f = arr[0];
      if (f.size > 2*1024*1024) return fail('Soubor je příliš velký (max 2 MB).');
      var r = new FileReader();
      r.onload = function () { out.value = btoa(String.fromCharCode.apply(null, new Uint8Array(r.result))); copyBtn.disabled = false; };
      r.onerror = function () { fail('Čtení souboru selhalo.'); };
      r.readAsArrayBuffer(f);
    },
    onError: fail
  });

  inEl.addEventListener('input', compute);
  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function(){ if(window.toast) toast.success('Zkopírováno'); });
  });
  clearBtn.addEventListener('click', function () { inEl.value=''; out.value=''; copyBtn.disabled=true; clearErr(); });
})();