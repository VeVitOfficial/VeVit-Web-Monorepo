// Otočení PDF stran přes pdf-lib, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('pr-drop'), work = ToolUI.el('pr-work'), angle = ToolUI.el('pr-angle');
  var pages = ToolUI.el('pr-pages'), run = ToolUI.el('pr-run'), err = ToolUI.el('pr-error');
  var prog = ToolUI.el('pr-prog'), progLabel = ToolUI.el('pr-prog-label');
  var file = null;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) { clearErr(); file = arr[0]; work.classList.remove('hidden'); run.disabled = false; },
    onError: fail
  });

  function parseRanges(s, total) {
    if (!s || !s.trim()) { var a = []; for (var i = 1; i <= total; i++) a.push(i); return a; }
    var set = {};
    s.split(',').forEach(function (part) {
      part = part.trim(); if (!part) return;
      var m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) { var lo = +m[1], hi = +m[2]; for (var i = lo; i <= hi; i++) if (i >= 1 && i <= total) set[i] = 1; }
      else { var n = +part; if (n >= 1 && n <= total) set[n] = 1; }
    });
    return Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  }

  run.addEventListener('click', function () {
    if (!file) return;
    clearErr(); run.disabled = true;
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 10, 'Načítám pdf-lib…');
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      ToolUI.setProgress(prog, 30, 'Načítám PDF…');
      return file.arrayBuffer();
    }).then(function (buf) {
      return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
    }).then(function (doc) {
      var total = doc.getPageCount();
      var sel = parseRanges(pages.value, total);
      if (!sel.length) throw new Error('Neplatný rozsah stran.');
      var deg = +angle.value;
      ToolUI.setProgress(prog, 60, 'Otáčím ' + sel.length + ' stran…');
      sel.forEach(function (n) { doc.getPage(n - 1).setRotation(window.PDFLib.degrees((doc.getPage(n - 1).getRotation().angle + deg) % 360)); });
      ToolUI.setProgress(prog, 85, 'Ukládám…');
      return doc.save({ useObjectStreams: true });
    }).then(function (bytes) {
      ToolUI.setProgress(prog, 100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'otoceno.pdf');
      if (window.toast) toast.success('PDF bylo otočeno');
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      fail(e && e.message ? e.message : 'Otočení selhalo.');
    });
  });
})();