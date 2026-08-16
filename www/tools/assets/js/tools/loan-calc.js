// Kalkulačka půjčky — anuitní splátka + amortizační tabulka. Čistě client-side.
(function () {
  'use strict';
  var amount = ToolUI.el('ln-amount');
  var rate = ToolUI.el('ln-rate');
  var years = ToolUI.el('ln-years');
  var freqSel = ToolUI.el('ln-freq');
  var payEl = ToolUI.el('ln-payment');
  var totalEl = ToolUI.el('ln-total');
  var intEl = ToolUI.el('ln-interest');
  var cntEl = ToolUI.el('ln-count');
  var tbody = ToolUI.el('ln-table');

  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }

  function kc(n) {
    if (n == null || isNaN(n)) return '—';
    return Math.round(n).toLocaleString('cs-CZ') + ' Kč';
  }

  function compute() {
    var P = num(amount.value);
    var r = num(rate.value);
    var y = num(years.value);
    var f = parseInt(freqSel.value, 10) || 12;
    if (P == null || P <= 0 || y == null || y <= 0 || r == null || r < 0) {
      payEl.textContent = totalEl.textContent = intEl.textContent = cntEl.textContent = '—';
      tbody.innerHTML = '';
      return;
    }
    var n = Math.round(y * f);            // počet splátek
    var i = r / 100 / f;                  // úrok na periodu
    var payment;
    if (i === 0) {
      payment = P / n;
    } else {
      payment = P * i / (1 - Math.pow(1 + i, -n));
    }

    var balance = P, totalInterest = 0;
    var rows = [];
    var cap = 600; // ochrana proti extrémům
    for (var k = 1; k <= n && k <= cap; k++) {
      var interest = balance * i;
      var principal = payment - interest;
      if (k === n && i !== 0) principal = balance; // poslední splátka vyrovná zůstatek
      balance -= principal;
      if (balance < 0.005) balance = 0;
      totalInterest += interest;
      rows.push([k, payment, interest, principal, balance]);
    }
    if (n > cap) {
      rows.push(['…', '—', '—', '—', '—']);
    }

    payEl.textContent = kc(payment);
    cntEl.textContent = String(n);
    totalEl.textContent = kc(payment * n);
    intEl.textContent = kc(totalInterest);

    // tabulka — bezpečné sestavení přes DOM (textContent)
    var frag = document.createDocumentFragment();
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      r.forEach(function (val, idx) {
        var td = document.createElement('td');
        if (idx === 0) { td.textContent = val; }
        else { td.textContent = (val === '—') ? '—' : kc(val); }
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    tbody.appendChild(frag);
  }

  ['amount', 'rate', 'years'].forEach(function (k) {
    ToolUI.el('ln-' + k).addEventListener('input', compute);
  });
  freqSel.addEventListener('change', compute);
  compute();
})();