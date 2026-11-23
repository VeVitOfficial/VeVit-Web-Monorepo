// PDF → Word (.docx): pdf.js text extraction + minimální OOXML přes JSZip.
(function () {
  'use strict';
  var drop = ToolUI.el('pw2-drop'), work = ToolUI.el('pw2-work'), info = ToolUI.el('pw2-info');
  var run = ToolUI.el('pw2-run'), err = ToolUI.el('pw2-error');
  var prog = ToolUI.el('pw2-prog'), progLabel = ToolUI.el('pw2-prog-label');
  var paragraphs = [], baseName = 'pdf-text.docx';

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function ensurePdfjs() {
    if (window.pdfjsLib) return Promise.resolve();
    return ToolUI.loadScript('/tools/assets/js/lib/pdf.min.js').then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/tools/assets/js/lib/pdf.worker.min.js';
    });
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function escAttr(s) { return esc(s).replace(/'/g, '&apos;'); }

  ToolUI.dropzone(drop, {
    accept: ['.pdf'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      var file = arr[0];
      baseName = file.name.replace(/\.pdf$/i, '') + '.docx';
      work.classList.add('hidden');
      prog.classList.remove('hidden'); progLabel.classList.remove('hidden');
      ToolUI.setProgress(prog, 5, 'Načítám pdf.js…');
      ensurePdfjs().then(function () {
        ToolUI.setProgress(prog, 15, 'Načítám PDF…');
        return file.arrayBuffer();
      }).then(function (buf) { return window.pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise; })
        .then(function (pdfDoc) {
          var total = pdfDoc.numPages, i = 1; paragraphs = [];
          function step() {
            if (i > total) { return; }
            ToolUI.setProgress(prog, 15 + Math.round(80 * (i - 1) / total), 'Extrahuji stranu ' + i + '/' + total);
            return pdfDoc.getPage(i).then(function (page) {
              return page.getTextContent().then(function (tc) {
                var last = null, line = '';
                tc.items.forEach(function (it) {
                  if (last !== null && Math.abs(it.transform[5] - last) > 2 && line) { paragraphs.push(line); line = ''; }
                  line += it.str; last = it.transform[5];
                });
                if (line) paragraphs.push(line);
                paragraphs.push(''); // konec strany = nový odstavec
                i++; return step();
              });
            });
          }
          return step().then(function () {
            if (!paragraphs.filter(function (p) { return p.trim(); }).length) {
              throw new Error('PDF neobsahuje extrahovatelný text (pravděpodobně sken).');
            }
          });
        }).then(function () {
          ToolUI.setProgress(prog, 100, 'Hotovo');
          prog.classList.add('hidden'); progLabel.classList.add('hidden');
          info.textContent = 'Extrahováno ' + paragraphs.filter(function (p) { return p.trim(); }).length + ' odstavců. Klikněte pro stažení .docx.';
          work.classList.remove('hidden');
          if (window.toast) toast.success('Text extrahován');
        }).catch(function (e) {
          prog.classList.add('hidden'); progLabel.classList.add('hidden');
          fail(e && e.message ? e.message : 'Extrakce selhala.');
        });
    },
    onError: fail
  });

  run.addEventListener('click', function () {
    if (!paragraphs.length) return;
    ToolUI.loadScript('/tools/assets/js/lib/jszip.min.js').then(function () {
      var zip = new JSZip();
      var body = paragraphs.map(function (p) {
        if (!p.trim()) return '<w:p/>';
        return '<w:p><w:r><w:t xml:space="preserve">' + esc(p) + '</w:t></w:r></w:p>';
      }).join('');
      zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
      zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
      zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
      zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '</w:body></w:document>');
      return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }).then(function (blob) {
      ToolUI.download(blob, baseName);
      if (window.toast) toast.success('.docx staženo');
    }).catch(function (e) { fail(e && e.message ? e.message : 'Sestavení .docx selhalo.'); });
  });
})();