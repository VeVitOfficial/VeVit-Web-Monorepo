// Otočení PDF stran přes pdf-lib, čistě client-side.
(function () {
  'use strict';
  var drop = ToolUI.el('pr-drop'), list = ToolUI.el('pr-list'), work = ToolUI.el('pr-work'), angle = ToolUI.el('pr-angle');
  var pages = ToolUI.el('pr-pages'), run = ToolUI.el('pr-run'), err = ToolUI.el('pr-error');
  var prog = ToolUI.el('pr-prog'), progLabel = ToolUI.el('pr-prog-label');
  var preview = ToolUI.el('pr-preview'), selection = ToolUI.el('pr-selection');
  var lifecycle = ToolUI.el('tool-root')._toolLifecycle;
  var file = null, sourceBytes = null, totalPages = 0;

  function fail(m) { ToolUI.showError(err, m); }
  function clearErr() { ToolUI.clearError(err); }

  function reset() {
    file = null; sourceBytes = null; totalPages = 0; preview.replaceChildren();
    list.classList.add('hidden'); work.classList.add('hidden'); run.disabled = true;
    lifecycle.setState('idle');
  }

  function ensurePdfjs() {
    if (window.pdfjsLib) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/pdf.min.js').then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/tools/assets/js/lib/pdf.worker.min.js';
    });
  }

  function updateSelection() {
    var selected = parseRanges(pages.value, totalPages);
    selection.textContent = selected.length + ' / ' + totalPages;
    preview.querySelectorAll('.pdf-page-card').forEach(function (card) {
      card.classList.toggle('is-selected', selected.indexOf(+card.dataset.page) !== -1);
      card.querySelector('canvas').style.transform = 'rotate(' + angle.value + 'deg)';
    });
    run.disabled = !selected.length;
  }

  function renderPreviews(pdf) {
    preview.replaceChildren(); totalPages = pdf.numPages;
    var limit = Math.min(totalPages, 24);
    var jobs = [];
    for (var i = 1; i <= limit; i++) (function (number) {
      jobs.push(pdf.getPage(number).then(function (page) {
        var viewport = page.getViewport({ scale: .24 });
        var card = document.createElement('button'); card.type = 'button'; card.className = 'pdf-page-card is-selected'; card.dataset.page = String(number);
        var canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        var label = document.createElement('span'); label.textContent = ToolUI.t('page', { number: number });
        card.appendChild(canvas); card.appendChild(label); preview.appendChild(card);
        card.addEventListener('click', function () {
          var current = parseRanges(pages.value, totalPages);
          if (!pages.value.trim()) { current = []; for (var n = 1; n <= totalPages; n++) current.push(n); }
          var at = current.indexOf(number); if (at === -1) current.push(number); else current.splice(at, 1);
          current.sort(function (a, b) { return a - b; }); pages.value = current.join(', '); updateSelection();
        });
        return page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
      }));
    })(i);
    return Promise.all(jobs).then(updateSelection);
  }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false, maxSize: 100 * 1024 * 1024,
    onFiles: function (arr) {
      clearErr(); file = arr[0]; lifecycle.setState('processing', ToolUI.t('loading'));
      ToolUI.renderFileList(list, [file], reset); list.classList.remove('hidden');
      Promise.all([ensurePdfjs(), file.arrayBuffer()]).then(function (values) {
        sourceBytes = values[1];
        return window.pdfjsLib.getDocument({ data: new Uint8Array(sourceBytes.slice(0)) }).promise;
      }).then(renderPreviews).then(function () { work.classList.remove('hidden'); lifecycle.setState('ready'); })
        .catch(function (e) { fail(e && e.message ? e.message : ToolUI.t('load_failed')); });
    },
    onError: fail
  });
  pages.addEventListener('input', updateSelection);
  angle.addEventListener('change', updateSelection);

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
    lifecycle.setState('processing');
    ToolUI.setProgress(prog, 10, ToolUI.t('loading'));
    ToolUI.loadScript('/tools/assets/js/lib/pdf-lib.min.js').then(function () {
      ToolUI.setProgress(prog, 30, ToolUI.t('loading'));
      return sourceBytes ? sourceBytes.slice(0) : file.arrayBuffer();
    }).then(function (buf) {
      return window.PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
    }).then(function (doc) {
      var total = doc.getPageCount();
      var sel = parseRanges(pages.value, total);
      if (!sel.length) throw new Error(ToolUI.t('invalid_range'));
      var deg = +angle.value;
      ToolUI.setProgress(prog, 60, ToolUI.t('state_processing'));
      sel.forEach(function (n) { doc.getPage(n - 1).setRotation(window.PDFLib.degrees((doc.getPage(n - 1).getRotation().angle + deg) % 360)); });
      ToolUI.setProgress(prog, 85, ToolUI.t('saving'));
      return doc.save({ useObjectStreams: true });
    }).then(function (bytes) {
      ToolUI.setProgress(prog, 100, ToolUI.t('state_success'));
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      ToolUI.download(new Blob([bytes], { type: 'application/pdf' }), 'otoceno.pdf');
    }).catch(function (e) {
      prog.classList.add('hidden'); progLabel.classList.add('hidden'); run.disabled = false;
      fail(e && e.message ? e.message : ToolUI.t('unknown_error'));
    });
  });
})();
