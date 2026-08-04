// HTML → PDF přes html2canvas + jsPDF, čistě client-side.
(function () {
  'use strict';
  var html = ToolUI.el('hp-html'), size = ToolUI.el('hp-size'), orient = ToolUI.el('hp-orient');
  var scale = ToolUI.el('hp-scale'), run = ToolUI.el('hp-run'), err = ToolUI.el('hp-error');
  var prog = ToolUI.el('hp-prog'), progLabel = ToolUI.el('hp-prog-label');

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function jsPDFClass() { return (window.jspdf && window.jspdf.jsPDF) || window.jsPDF; }

  run.addEventListener('click', function () {
    clearErr();
    if (!html.value.trim()) return fail('Vložte HTML kód.');
    var J = jsPDFClass();
    if (!J) {
      ToolUI.loadScript('/tools/assets/js/lib/jspdf.umd.min.js').then(function () {
        if (!jsPDFClass()) return fail('Knihovnu jsPDF se nepodařilo načíst.');
        go();
      });
    } else go();
  });

  function go() {
    if (!window.html2canvas) {
      ToolUI.loadScript('/tools/assets/js/lib/html2canvas.min.js').then(function () {
        if (!window.html2canvas) return fail('Knihovnu html2canvas se nepodařilo načíst.');
        render();
      });
    } else render();
  }

  function render() {
    if (!window.VeVitHtmlPdfSanitizer) return fail('Bezpečný renderer HTML se nepodařilo načíst.');
    var safeHtml;
    try { safeHtml = window.VeVitHtmlPdfSanitizer.sanitize(html.value); }
    catch (e) { return fail(e && e.message ? e.message : 'HTML se nepodařilo bezpečně připravit.'); }
    prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
    ToolUI.setProgress(prog, 10, 'Připravuji kontejner…');

    // User HTML is only ever parsed into this script-free sandbox. The renderer
    // needs DOM read access, so allow-same-origin is paired with no allow-scripts
    // and with the narrow sanitizer above.
    var holder = document.createElement('iframe');
    holder.setAttribute('sandbox', window.VeVitHtmlPdfSanitizer.sandbox);
    holder.setAttribute('title', 'Bezpečný náhled HTML pro export');
    holder.style.position = 'fixed'; holder.style.left = '-99999px'; holder.style.top = '0';
    holder.style.width = '842px'; holder.style.height = '1191px'; holder.style.border = '0';
    holder.srcdoc = window.VeVitHtmlPdfSanitizer.srcdoc(safeHtml);
    document.body.appendChild(holder);
    var s = parseFloat(scale.value) || 2;
    holder.addEventListener('load', function () {
      var frameDocument;
      try { frameDocument = holder.contentDocument; }
      catch (_) { cleanup(); return fail('Bezpečný náhled nelze v tomto prohlížeči vykreslit.'); }
      if (!frameDocument || !frameDocument.body) { cleanup(); return fail('Bezpečný náhled HTML se nepodařilo vytvořit.'); }
      ToolUI.setProgress(prog, 25, 'Renderuji přes html2canvas…');
      window.html2canvas(frameDocument.body, { scale: s, backgroundColor: '#ffffff', useCORS: false }).then(function (canvas) {
      ToolUI.setProgress(prog, 70, 'Sestavuji PDF…');
      cleanup();
      var J = jsPDFClass();
      var fmt = size.value, o = orient.value;
      var pdf = new J({ orientation: o, unit: 'pt', format: fmt });
      var pw = pdf.internal.pageSize.getWidth(), ph = pdf.internal.pageSize.getHeight();
      var imgW = pw, imgH = canvas.height * (imgW / canvas.width);
      var dataURL = canvas.toDataURL('image/jpeg', 0.92);
      var remaining = imgH, pos = 0;
      // první stránka
      pdf.addImage(dataURL, 'JPEG', 0, pos, imgW, imgH);
      remaining -= ph; pos -= ph;
      while (remaining > 0) { pdf.addPage(); pdf.addImage(dataURL, 'JPEG', 0, pos, imgW, imgH); remaining -= ph; pos -= ph; }
      ToolUI.setProgress(prog, 100, 'Hotovo');
      prog.classList.add('hidden'); progLabel.classList.add('hidden');
      pdf.save('html-dokument.pdf');
      if (window.toast) toast.success('PDF vygenerováno');
      }).catch(function (e) {
      cleanup();
      prog.classList.add('hidden'); progLabel.classList.add('hidden');
      fail(e && e.message ? e.message : 'Generování PDF selhalo.');
      });
    }, { once: true });

    function cleanup() { if (holder.parentNode) holder.parentNode.removeChild(holder); }
  }
})();
