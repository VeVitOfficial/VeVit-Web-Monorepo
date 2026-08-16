// Myšlenková mapa — radiální strom z odsazeného textu (SVG), čistě client-side.
(function () {
  'use strict';
  var inEl = ToolUI.el('mm-in'), wrap = ToolUI.el('mm-svg-wrap');
  var svgDl = ToolUI.el('mm-svg-dl'), sample = ToolUI.el('mm-sample');
  var NS = 'http://www.w3.org/2000/svg';
  var COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#fb7185', '#4ade80'];

  function parse(text) {
    var roots = [], stack = []; // stack of {node, depth}
    text.split('\n').forEach(function (raw) {
      var m = raw.match(/^(\s*)(.*)$/);
      var indent = m[1].replace(/\t/g, '  ');
      var depth = Math.floor(indent.length / 2);
      var label = m[2].trim();
      if (!label) return;
      while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
      var node = { label: label, depth: depth, children: [], angle: 0, r: 0, x: 0, y: 0 };
      if (stack.length) stack[stack.length - 1].node.children.push(node);
      else roots.push(node);
      stack.push({ node: node, depth: depth });
    });
    return roots;
  }
  function countLeaves(n) { return n.children.length ? n.children.reduce(function (s, c) { return s + countLeaves(c); }, 0) : 1; }

  function layout(roots, cx, cy, DR) {
    var totalLeaves = roots.reduce(function (s, r) { return s + countLeaves(r); }, 0) || 1;
    var start = -Math.PI / 2;
    var gap = roots.length > 1 ? 0.12 : 0;
    var span = Math.PI * 2 - gap * roots.length;
    roots.forEach(function (r) {
      var cl = countLeaves(r);
      var w = span * (cl / totalLeaves);
      assign(r, start, start + w, 0, cx, cy, DR);
      start += w + gap;
    });
  }
  function assign(node, s, e, depth, cx, cy, DR) {
    node.depth = depth;
    node.r = depth * DR;
    if (!node.children.length) { node.angle = (s + e) / 2; }
    else {
      var leaves = countLeaves(node);
      var cur = s;
      node.children.forEach(function (c) {
        var cl = countLeaves(c);
        var w = (e - s) * (cl / leaves);
        assign(c, cur, cur + w, depth + 1, cx, cy, DR);
        cur += w;
      });
      node.angle = (node.children[0].angle + node.children[node.children.length - 1].angle) / 2;
    }
    node.x = cx + node.r * Math.cos(node.angle);
    node.y = cy + node.r * Math.sin(node.angle);
  }

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function render() {
    wrap.textContent = '';
    var roots = parse(inEl.value);
    if (!roots.length) { wrap.textContent = ''; return; }
    var maxDepth = 0;
    function md(n) { maxDepth = Math.max(maxDepth, n.depth); n.children.forEach(md); }
    roots.forEach(md);
    var DR = 130;
    var cx = (maxDepth + 0.7) * DR, cy = (maxDepth + 0.7) * DR;
    var R = (maxDepth + 0.7) * DR * 2;
    layout(roots, cx, cy, DR);

    var svg = el('svg', { viewBox: '0 0 ' + R + ' ' + R, width: R, height: R, style: 'max-width:100%;height:auto;background:transparent' });

    function drawLinks(node) {
      node.children.forEach(function (c) {
        svg.appendChild(el('path', { d: 'M' + node.x + ',' + node.y + ' L' + c.x + ',' + c.y, stroke: 'rgba(255,255,255,0.18)', 'stroke-width': '1.5', fill: 'none' }));
        drawLinks(c);
      });
    }
    roots.forEach(drawLinks);

    function drawNode(node, idx) {
      var color = COLORS[(node.depth) % COLORS.length];
      if (node.depth === 0) {
        svg.appendChild(el('circle', { cx: node.x, cy: node.y, r: 30, fill: color, opacity: '0.9' }));
      } else {
        var w = Math.max(40, node.label.length * 7.5 + 16);
        svg.appendChild(el('rect', { x: node.x - w / 2, y: node.y - 13, width: w, height: 26, rx: 13, fill: 'rgba(31,41,55,0.85)', stroke: color, 'stroke-width': '1.5' }));
      }
      var t = el('text', { x: node.x, y: node.y + (node.depth === 0 ? 5 : 4), 'text-anchor': 'middle', 'font-size': node.depth === 0 ? 13 : 12, 'font-family': 'inherit', fill: node.depth === 0 ? '#0b1220' : '#e5e7eb' });
      t.textContent = node.label.length > 22 ? node.label.slice(0, 21) + '…' : node.label;
      svg.appendChild(t);
      node.children.forEach(function (c) { drawNode(c); });
    }
    roots.forEach(function (r, i) { drawNode(r, i); });
    wrap.appendChild(svg);
  }

  inEl.addEventListener('input', render);
  sample.addEventListener('click', function () {
    inEl.value = 'Plán roku\n  Cíle\n    Osobní\n    Pracovní\n  Finance\n    Příjmy\n    Úspory\n    Investice\n  Zdraví\n    Sport\n    Jídelníček\n    Spánek';
    render();
  });
  svgDl.addEventListener('click', function () {
    var svg = wrap.querySelector('svg'); if (!svg) return;
    var xml = new XMLSerializer().serializeToString(svg);
    var blob = new Blob(['<?xml version="1.0"?>\n' + xml], { type: 'image/svg+xml' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mind-map.svg'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  render();
})();