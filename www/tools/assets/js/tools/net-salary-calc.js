// Kalkulačka čisté mzdy — zjednodušený odhad pro CZ 2024, živý výpočet.
(function () {
  'use strict';
  var levy = ToolUI.el('ns-levy'), tax = ToolUI.el('ns-tax');
  var net = ToolUI.el('ns-net'), eff = ToolUI.el('ns-eff');

  function num(id) {
    var v = ToolUI.el(id).value;
    if (v === '' || v == null) return null;
    var n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
  function kc(n) { return n.toLocaleString('cs-CZ', { maximumFractionDigits: 0 }) + ' Kč'; }

  // Daňové zvýhodnění na dítě (měsíční), 2024.
  var CHILD = [0, 1467, 2170, 2520];
  function childBonus(n) {
    n = Math.max(0, Math.min(10, n));
    if (n <= 3) return CHILD[n];
    return CHILD[3] + (n - 3) * 2520; // další děti jako 3.+
  }

  function compute() {
    var g = num('ns-gross');
    if (g == null) { levy.textContent='—'; tax.textContent='—'; net.textContent='—'; eff.textContent='—'; return; }
    var childN = Math.round(num('ns-children') || 0);
    var useDiscount = ToolUI.el('ns-discount').value === '1';

    var odvody = g * 0.11;                       // 6,5 % sociální + 4,5 % zdravotní
    var superGross = g * 1.34;                   // superhrubá
    var zaklad = superGross - odvody;            // základ daně = superhrubá − odvody zaměstnance
    var sleva = useDiscount ? 2570 : 0;
    var zakladPoSleve = Math.max(0, zaklad - sleva);
    var zaloha = zakladPoSleve * 0.15;           // sazba 15 % (solidární nad limit zde neuvažujeme)
    var bonus = childBonus(childN);
    zaloha = Math.max(0, zaloha - bonus);        // zvýhodnění snižuje zálohu (min 0)

    var n = g - odvody - zaloha;
    levy.textContent = kc(odvody);
    tax.textContent = kc(zaloha);
    net.textContent = kc(n);
    eff.textContent = g > 0 ? ((1 - n / g) * 100).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' %' : '—';
  }

  ['ns-gross', 'ns-children'].forEach(function (id) { ToolUI.el(id).addEventListener('input', compute); });
  ToolUI.el('ns-discount').addEventListener('change', compute);
  compute();
})();