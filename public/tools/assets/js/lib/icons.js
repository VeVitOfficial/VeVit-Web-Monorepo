// Bezpečný builder ikon přes DOM (createElementNS) — náhrada za innerHTML s konstantami.
// Ikony, které se dynamicky mění v JS (Copy ↔ Check). Ostatní ikony se renderují v PHP.
(function () {
  var NS = 'http://www.w3.org/2000/svg';

  function attrs(el, obj) {
    Object.keys(obj).forEach(function (k) { el.setAttribute(k, obj[k]); });
  }

  var DEFS = {
    Copy: function (svg) {
      var r = document.createElementNS(NS, 'rect');
      attrs(r, { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 });
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2');
      svg.appendChild(r); svg.appendChild(p);
    },
    Check: function (svg) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', 'M20 6 9 17l-5-5');
      svg.appendChild(p);
    },
    X: function (svg) {
      var a = document.createElementNS(NS, 'path'); a.setAttribute('d', 'M18 6 6 18');
      var b = document.createElementNS(NS, 'path'); b.setAttribute('d', 'm6 6 12 12');
      svg.appendChild(a); svg.appendChild(b);
    },
    Upload: function (svg) {
      var a = document.createElementNS(NS, 'path'); a.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
      var b = document.createElementNS(NS, 'path'); b.setAttribute('d', 'M17 8l-5-5-5 5');
      var c = document.createElementNS(NS, 'path'); c.setAttribute('d', 'M12 3v12');
      svg.appendChild(a); svg.appendChild(b); svg.appendChild(c);
    },
    Download: function (svg) {
      var a = document.createElementNS(NS, 'path'); a.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
      var b = document.createElementNS(NS, 'path'); b.setAttribute('d', 'M7 10l5 5 5-5');
      var c = document.createElementNS(NS, 'path'); c.setAttribute('d', 'M12 15V3');
      svg.appendChild(a); svg.appendChild(b); svg.appendChild(c);
    },
    File: function (svg) {
      var a = document.createElementNS(NS, 'path'); a.setAttribute('d', 'M14 2v5a1 1 0 0 0 1 1h5');
      var b = document.createElementNS(NS, 'path'); b.setAttribute('d', 'M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z');
      svg.appendChild(a); svg.appendChild(b);
    },
    Eye: function (svg) {
      var a = document.createElementNS(NS, 'path'); a.setAttribute('d', 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0');
      var c = document.createElementNS(NS, 'circle'); attrs(c, { cx: 12, cy: 12, r: 3 });
      svg.appendChild(a); svg.appendChild(c);
    },
    EyeOff: function (svg) {
      var a = document.createElementNS(NS, 'path'); a.setAttribute('d', 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49');
      var b = document.createElementNS(NS, 'path'); b.setAttribute('d', 'M14.084 14.158a3 3 0 0 1-4.242-4.242');
      var c = document.createElementNS(NS, 'path'); c.setAttribute('d', 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143');
      var d = document.createElementNS(NS, 'path'); d.setAttribute('d', 'm2 2 20 20');
      svg.appendChild(a); svg.appendChild(b); svg.appendChild(c); svg.appendChild(d);
    },
  };

  function build(name, size) {
    var svg = document.createElementNS(NS, 'svg');
    attrs(svg, { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    if (DEFS[name]) DEFS[name](svg);
    return svg;
  }

  // Fragment se dvěma ikonami (copy/check) ve spanech pro přepínání viditelnosti.
  function copyCheckPair(size) {
    var a = document.createElement('span'); a.className = 'ico ico-copy'; a.appendChild(build('Copy', size));
    var b = document.createElement('span'); b.className = 'ico ico-check hidden'; b.appendChild(build('Check', size));
    var frag = document.createDocumentFragment();
    frag.appendChild(a); frag.appendChild(b);
    return frag;
  }

  // Přepne zobrazení copy→check na daném tlačítku (obsahuje .ico-copy/.ico-check).
  function flashCopied(btn, label, doneText, resetText) {
    var c = btn.querySelector('.ico-copy'), k = btn.querySelector('.ico-check');
    if (c) c.classList.add('hidden');
    if (k) k.classList.remove('hidden');
    if (label) label.textContent = doneText;
    setTimeout(function () {
      if (c) c.classList.remove('hidden');
      if (k) k.classList.add('hidden');
      if (label) label.textContent = resetText;
    }, 2000);
  }

  window.Icon = { build: build, copyCheckPair: copyCheckPair, flashCopied: flashCopied };
})();