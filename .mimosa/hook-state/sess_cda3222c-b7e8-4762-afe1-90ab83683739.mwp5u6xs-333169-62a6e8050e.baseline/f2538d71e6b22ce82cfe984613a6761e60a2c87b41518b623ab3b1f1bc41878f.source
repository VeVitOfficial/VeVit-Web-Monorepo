// Konverze číselných soustav — bin/oct/dec/hex.
(function () {
  var valueEl = document.getElementById('nb-value');
  var fromEl = document.getElementById('nb-from');
  var outs = document.querySelectorAll('.nb-out');
  var copies = document.querySelectorAll('.nb-copy');

  function convert() {
    var val = valueEl.value.replace(/\s/g, '');
    var from = parseInt(fromEl.value, 10);
    var num;
    if (!val) { outs.forEach(function (o) { o.value = ''; }); copies.forEach(function (b) { b.disabled = true; }); return; }
    num = parseInt(val, from);
    if (isNaN(num) || num < 0) { outs.forEach(function (o) { o.value = ''; }); copies.forEach(function (b) { b.disabled = true; }); return; }
    outs.forEach(function (o) {
      var r = parseInt(o.dataset.radix, 10);
      o.value = num.toString(r).toUpperCase();
    });
    copies.forEach(function (b) { b.disabled = false; });
  }

  valueEl.addEventListener('input', convert);
  fromEl.addEventListener('change', convert);

  copies.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var out = document.querySelector('.nb-out[data-radix="' + btn.dataset.radix + '"]');
      if (!out.value) return;
      navigator.clipboard.writeText(out.value).then(function () {
        toast.success('Zkopírováno');
        Icon.flashCopied(btn, null, '', '');
      });
    });
  });

  convert();
})();