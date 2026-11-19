/*
 * Static HTML sanitizer for the HTML -> PDF tool.
 *
 * This is intentionally not a general HTML sanitizer. It creates a narrow,
 * inert document for rasterisation and never inserts user markup into the
 * application's document. The renderer needs read access to the iframe DOM,
 * therefore the sandbox uses allow-same-origin but never allow-scripts.
 */
(function () {
  'use strict';

  var MAX_INPUT_CHARS = 200000;
  var ALLOWED_TAGS = new Set([
    'P', 'BR', 'STRONG', 'EM', 'B', 'I', 'U', 'S', 'DEL', 'SMALL', 'MARK',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'SPAN', 'BLOCKQUOTE', 'PRE',
    'CODE', 'UL', 'OL', 'LI', 'DL', 'DT', 'DD', 'HR', 'TABLE', 'THEAD',
    'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'CAPTION', 'IMG'
  ]);
  var DROP_TAGS = new Set([
    'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'BASE', 'META', 'LINK', 'FORM',
    'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'OPTION', 'SVG', 'MATH',
    'VIDEO', 'AUDIO', 'SOURCE', 'TRACK', 'CANVAS', 'STYLE'
  ]);
  var TEXT_ONLY_TAGS = new Set(['A', 'LABEL', 'DETAILS', 'SUMMARY']);
  var ALLOWED_ATTRIBUTES = new Set(['alt', 'title', 'width', 'height', 'colspan', 'rowspan', 'scope']);
  var DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i;

  function appendSanitized(source, target) {
    Array.prototype.forEach.call(source.childNodes, function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        target.appendChild(document.createTextNode(node.nodeValue || ''));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      var tag = node.tagName.toUpperCase();
      if (DROP_TAGS.has(tag)) return;
      if (TEXT_ONLY_TAGS.has(tag) || !ALLOWED_TAGS.has(tag)) {
        appendSanitized(node, target);
        return;
      }

      var clean = document.createElement(tag.toLowerCase());
      Array.prototype.forEach.call(node.attributes, function (attr) {
        var name = attr.name.toLowerCase();
        if (ALLOWED_ATTRIBUTES.has(name)) clean.setAttribute(name, attr.value);
      });
      if (tag === 'IMG') {
        var sourceUrl = node.getAttribute('src') || '';
        if (!DATA_IMAGE.test(sourceUrl)) return;
        clean.setAttribute('src', sourceUrl.replace(/\s+/g, ''));
      }
      appendSanitized(node, clean);
      target.appendChild(clean);
    });
  }

  function sanitize(input) {
    if (typeof input !== 'string') throw new TypeError('HTML vstup musí být text.');
    if (input.length > MAX_INPUT_CHARS) throw new RangeError('HTML vstup je příliš dlouhý (max. 200 000 znaků).');
    var parsed = new DOMParser().parseFromString(input, 'text/html');
    var holder = document.createElement('div');
    appendSanitized(parsed.body, holder);
    return holder.innerHTML;
  }

  function srcdoc(safeHtml) {
    return '<!doctype html><html><head><meta charset="utf-8">' +
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'none\'; object-src \'none\'; base-uri \'none\'; form-action \'none\'; frame-src \'none\'">' +
      '</head><body>' + safeHtml + '</body></html>';
  }

  window.VeVitHtmlPdfSanitizer = {
    sanitize: sanitize,
    srcdoc: srcdoc,
    sandbox: 'allow-same-origin',
    maxInputChars: MAX_INPUT_CHARS
  };
}());
