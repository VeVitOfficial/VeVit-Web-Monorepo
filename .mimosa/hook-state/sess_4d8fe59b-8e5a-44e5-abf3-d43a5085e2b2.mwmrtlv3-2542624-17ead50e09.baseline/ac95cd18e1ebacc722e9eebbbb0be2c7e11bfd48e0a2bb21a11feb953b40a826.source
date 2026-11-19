// Kalkulačka půjčky — anuitní splátka + amortizační tabulka. Čistě client-side.
(function () {
  'use strict';
  var amount = ToolUI.el('ln-amount');
  var rate = ToolUI.el('ln-rate');
  var years = ToolUI.el('ln-years');
  var freqSel = ToolUI.el('ln-freq');
  var extraEl = ToolUI.el('ln-extra');
  var payEl = ToolUI.el('ln-payment');
  var totalEl = ToolUI.el('ln-total');
  var intEl = ToolUI.el('ln-interest');
  var cntEl = ToolUI.el('ln-count');
  var tbody = ToolUI.el('ln-table');
  var principalBar = ToolUI.el('ln-principal-bar'), interestBar = ToolUI.el('ln-interest-bar');
  var principalPct = ToolUI.el('ln-principal-pct'), interestPct = ToolUI.el('ln-interest-pct');
  var lifecycle = ToolUI.el('tool-root')._toolLifecycle;
  var locale = document.documentElement.lang || 'cs';

  function num(v) { var n = parseFloat(v); return isNaN(n) ? null : n; }

  function kc(n) {
    if (n == null || isNaN(n)) return '—';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(n);
  }

  function compute() {
    var P = num(amount.value);
    var r = num(rate.value);
    var y = num(years.value);
    var f = parseInt(freqSel.value, 10) || 12;
    var extra = Math.max(0, num(extraEl.value) || 0);
    if (P == null || P <= 0 || y == null || y <= 0 || r == null || r < 0) {
      payEl.textContent = totalEl.textContent = intEl.textContent = cntEl.textContent = '—';
      tbody.innerHTML = '';
      principalBar.style.width = interestBar.style.width = '0'; principalPct.textContent = interestPct.textContent = '—'; lifecycle.setState('error');
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
    var actualTotal = 0;
    for (var k = 1; balance > .005 && k <= n && k <= cap; k++) {
      var interest = balance * i;
      var actualPayment = Math.min(payment + extra, balance + interest);
      var principal = actualPayment - interest;
      balance -= principal;
      if (balance < 0.005) balance = 0;
      totalInterest += interest;
      actualTotal += actualPayment;
      rows.push([k, actualPayment, interest, principal, balance]);
    }
    if (n > cap) {
      rows.push(['…', '—', '—', '—', '—']);
    }

    payEl.textContent = kc(payment + extra);
    cntEl.textContent = String(rows.length);
    totalEl.textContent = kc(actualTotal);
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
    var principalShare = actualTotal ? P / actualTotal * 100 : 100, interestShare = 100 - principalShare;
    principalBar.style.width = principalShare + '%'; interestBar.style.width = interestShare + '%';
    principalPct.textContent = Math.round(principalShare) + ' %'; interestPct.textContent = Math.round(interestShare) + ' %';
    lifecycle.setState('success');
  }

  ['amount', 'rate', 'years', 'extra'].forEach(function (k) {
    ToolUI.el('ln-' + k).addEventListener('input', compute);
  });
  freqSel.addEventListener('change', compute);
  ToolUI.el('ln-print').addEventListener('click', function () { window.print(); });
  compute();
})();
