// Generátor barevné palety (HSL), čistě client-side.
(function () {
  'use strict';
  var base = ToolUI.el('cp-base'), pick = ToolUI.el('cp-pick'), scheme = ToolUI.el('cp-scheme');
  var out = ToolUI.el('cp-out');

  function hexToHsl(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    var r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    var h = 0, s = 0, l = (mx + mn) / 2;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      switch (mx) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); };
    var to = function (x) { var v = Math.round(255 * x); return v.toString(16).padStart(2, '0'); };
    return '#' + to(f(0)) + to(f(8)) + to(f(4));
  }

  function palette(hsl) {
    var h = hsl[0], s = hsl[1], l = hsl[2];
    switch (scheme.value) {
      case 'complementary': return [[h, s, l], [(h + 180) % 360, s, l]];
      case 'analogous': return [[(h + 330) % 360, s, l], [h, s, l], [(h + 30) % 360, s, l]];
      case 'triadic': return [[h, s, l], [(h + 120) % 360, s, l], [(h + 240) % 360, s, l]];
      case 'tetradic': return [[h, s, l], [(h + 90) % 360, s, l], [(h + 180) % 360, s, l], [(h + 270) % 360, s, l]];
      case 'monochromatic': return [20, 40, 60, 80].map(function (ll) { return [h, s, ll]; });
      case 'shades': return [10, 25, 40, 55, 70, 85].map(function (ll) { return [h, s, ll]; });
      default: return [[h, s, l]];
    }
  }

  function render() {
    out.textContent = '';
    var hsl = hexToHsl(base.value);
    if (!hsl) return;
    pick.value = /^#[0-9a-f]{6}$/i.test(base.value) ? base.value : pick.value;
    palette(hsl).forEach(function (c) {
      var hex = hslToHex(c[0], c[1], c[2]);
      var sw = document.createElement('button');
      sw.type = 'button';
      sw.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-end;width:7rem;height:6rem;border-radius:0.75rem;border:1px solid rgba(255,255,255,0.1);background:' + hex + ';color:' + (c[2] > 55 ? '#111' : '#fff') + ';font-family:ui-monospace,monospace;font-size:0.8rem;padding:0.4rem;cursor:pointer';
      sw.textContent = hex;
      sw.title = 'Klik = kopírovat ' + hex;
      sw.addEventListener('click', function () {
        navigator.clipboard.writeText(hex).then(function () { if (window.toast) toast.success(hex + ' zkopírováno'); });
      });
      out.appendChild(sw);
    });
  }

  base.addEventListener('input', render);
  pick.addEventListener('input', function () { base.value = pick.value; render(); });
  scheme.addEventListener('change', render);
  render();
})();