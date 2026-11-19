// CSS Gradient Editor — lineární/radiální/konický, živý náhled + export CSS.
(function () {
  'use strict';
  var typeSel = ToolUI.el('gg-type'), angle = ToolUI.el('gg-angle'), angleVal = ToolUI.el('gg-angle-val');
  var angleWrap = ToolUI.el('gg-angle-wrap'), stopsEl = ToolUI.el('gg-stops');
  var preview = ToolUI.el('gg-preview'), cssOut = ToolUI.el('gg-css'), copyBtn = ToolUI.el('gg-copy');
  var seq = 0;
  var stops = [];

  function buildStop(color, pos) {
    seq++;
    var row = document.createElement('div'); row.className = 'row'; row.style.cssText='gap:0.5rem;align-items:center;flex-wrap:wrap';
    var c = document.createElement('input'); c.type = 'color'; c.value = color; c.className='input'; c.style.cssText='width:3.5rem;height:2.5rem;padding:0.2rem';
    c.setAttribute('aria-label', 'Barva zarážky');
    var p = document.createElement('input'); p.type='number'; p.className='input'; p.style.width='5rem'; p.min=0; p.max=100; p.step=1; p.value=pos; p.inputMode='numeric';
    p.setAttribute('aria-label', 'Pozice %');
    var lab = document.createElement('span'); lab.className='muted'; lab.style.fontSize='0.8rem'; lab.textContent='%';
    var rm = document.createElement('button'); rm.type='button'; rm.className='btn btn-ghost btn-icon-sm'; rm.setAttribute('aria-label','Odebrat zarážku');
    rm.appendChild(window.Icon ? Icon.build('X',16) : document.createTextNode('×'));
    rm.addEventListener('click', function () { row.remove(); render(); });
    function upd() { render(); }
    c.addEventListener('input', upd); p.addEventListener('input', upd);
    row.appendChild(c); row.appendChild(p); row.appendChild(lab); row.appendChild(rm);
    row._get = function () { return { color: c.value, pos: clampP(p.value) }; };
    stopsEl.appendChild(row);
    return row;
  }
  function clampP(v) { var n = parseInt(v,10); if (isNaN(n)) return 0; return Math.max(0, Math.min(100, n)); }

  function gather() {
    var out = [];
    Array.prototype.forEach.call(stopsEl.children, function (row) { if (row._get) out.push(row._get()); });
    if (!out.length) return [];
    out.sort(function (a,b) { return a.pos - b.pos; });
    return out;
  }

  function render() {
    var t = typeSel.value, ang = parseInt(angle.value,10) || 0;
    angleVal.textContent = ang;
    angleWrap.classList.toggle('hidden', t === 'radial');
    var s = gather();
    var list = s.map(function (x) { return x.color + ' ' + x.pos + '%'; }).join(', ');
    var g;
    if (t === 'linear') g = 'linear-gradient(' + ang + 'deg, ' + list + ')';
    else if (t === 'radial') g = 'radial-gradient(circle, ' + list + ')';
    else g = 'conic-gradient(from ' + ang + 'deg, ' + list + ')';
    if (!list) g = 'linear-gradient(0deg, #000, #000)';
    preview.style.background = g;
    cssOut.value = 'background: ' + g + ';';
  }

  angle.addEventListener('input', render);
  typeSel.addEventListener('change', render);
  ToolUI.el('gg-add-stop').addEventListener('click', function () {
    var cols = ['#6366f1','#ec4899','#f59e0b'];
    buildStop(cols[seq % 3], seq === 0 ? 0 : 100);
    render();
  });
  copyBtn.addEventListener('click', function () {
    var v = cssOut.value; if (!v) return;
    navigator.clipboard.writeText(v).then(function(){ if(window.toast) toast.success('CSS zkopírováno'); });
  });

  // výchozí 2 zarážky
  buildStop('#6366f1', 0); buildStop('#ec4899', 100);
  render();
})();