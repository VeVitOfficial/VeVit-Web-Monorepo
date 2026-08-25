// Text na řeč přes Web Speech API, čistě client-side.
(function () {
  'use strict';
  var inEl = ToolUI.el('ts-in'), voiceSel = ToolUI.el('ts-voice'), langSel = ToolUI.el('ts-lang');
  var rate = ToolUI.el('ts-rate'), pitch = ToolUI.el('ts-pitch');
  var rateV = ToolUI.el('ts-rate-v'), pitchV = ToolUI.el('ts-pitch-v');
  var speak = ToolUI.el('ts-speak'), pause = ToolUI.el('ts-pause'), stop = ToolUI.el('ts-stop');
  var err = ToolUI.el('ts-error');
  var voices = [];

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  if (!('speechSynthesis' in window)) { fail('Váš prohlížeč nepodporuje Web Speech API.'); speak.disabled = true; return; }

  function loadVoices() {
    voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return;
    var langs = {};
    voices.forEach(function (v) { langs[v.lang] = true; });
    var prevLang = langSel.value;
    langSel.innerHTML = '<option value="">Všechny</option>';
    Object.keys(langs).sort().forEach(function (l) {
      var o = document.createElement('option'); o.value = l; o.textContent = l; langSel.appendChild(o);
    });
    if (prevLang) langSel.value = prevLang;
    fillVoices();
  }
  function fillVoices() {
    var f = langSel.value;
    var cur = voiceSel.value;
    voiceSel.innerHTML = '';
    var list = voices.filter(function (v) { return !f || v.lang === f; });
    if (!list.length) list = voices;
    list.forEach(function (v) {
      var o = document.createElement('option');
      o.value = voices.indexOf(v);
      o.textContent = v.name + ' (' + v.lang + ')';
      voiceSel.appendChild(o);
    });
    // prefer cs-* or sk-*
    var pref = list.filter(function (v) { return /^cs|^sk/i.test(v.lang); })[0];
    if (pref) voiceSel.value = voices.indexOf(pref);
    else if (cur) { var old = list.filter(function (v) { return voices.indexOf(v) === +cur; })[0]; if (old) voiceSel.value = cur; }
  }

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
  langSel.addEventListener('change', fillVoices);

  rate.addEventListener('input', function () { rateV.textContent = (+rate.value).toFixed(1); });
  pitch.addEventListener('input', function () { pitchV.textContent = (+pitch.value).toFixed(1); });

  speak.addEventListener('click', function () {
    clearErr();
    var text = inEl.value.trim();
    if (!text) return fail('Zadejte text k přečtení.');
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    var idx = +voiceSel.value;
    if (!isNaN(idx) && voices[idx]) { u.voice = voices[idx]; u.lang = voices[idx].lang; }
    u.rate = +rate.value; u.pitch = +pitch.value;
    u.onerror = function (e) { if (e.error !== 'canceled' && e.error !== 'interrupted') fail('Chyba řeči: ' + (e.error || 'neznámá')); };
    window.speechSynthesis.speak(u);
  });
  pause.addEventListener('click', function () {
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume(); else window.speechSynthesis.pause();
      pause.textContent = window.speechSynthesis.paused ? 'Pokračovat' : 'Pozastavit';
    }
  });
  stop.addEventListener('click', function () { window.speechSynthesis.cancel(); pause.textContent = 'Pozastavit'; });
})();