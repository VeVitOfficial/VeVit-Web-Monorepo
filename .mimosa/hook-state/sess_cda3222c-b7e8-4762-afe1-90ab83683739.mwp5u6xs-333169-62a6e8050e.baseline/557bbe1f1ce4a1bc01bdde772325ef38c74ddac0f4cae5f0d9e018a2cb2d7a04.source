// UUID generátor (v4 + v7)
(function () {
  var countInput = document.getElementById('uuid-count');
  var list = document.getElementById('uuid-list');

  function uuidV4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    return hexify(b);
  }

  function uuidV7() {
    var b = crypto.getRandomValues(new Uint8Array(16));
    var ts = Date.now(); // ms od epochy
    b[0] = (ts / 0x10000000000) & 0xff;
    b[1] = (ts / 0x100000000) & 0xff;
    b[2] = (ts / 0x1000000) & 0xff;
    b[3] = (ts / 0x10000) & 0xff;
    b[4] = (ts / 0x100) & 0xff;
    b[5] = ts & 0xff;
    b[6] = (b[6] & 0x0f) | 0x70; // verze 7
    b[8] = (b[8] & 0x3f) | 0x80; // varianta
    return hexify(b);
  }

  function hexify(b) {
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); });
    return h.slice(0, 4).join('') + '-' + h.slice(4, 6).join('') + '-' + h.slice(6, 8).join('') + '-' + h.slice(8, 10).join('') + '-' + h.slice(10, 16).join('');
  }

  function empty() {
    list.replaceChildren();
    var p = document.createElement('p');
    p.className = 'muted'; p.style.fontSize = '0.875rem';
    p.textContent = 'Klikněte na tlačítko pro generování UUID.';
    list.appendChild(p);
  }

  function render(ids) {
    list.replaceChildren();
    if (ids.length === 0) return empty();
    ids.forEach(function (id) {
      var row = document.createElement('div'); row.className = 'uuid-row';
      var span = document.createElement('span'); span.textContent = id;
      var btn = document.createElement('button'); btn.className = 'btn btn-ghost btn-icon-sm';
      btn.appendChild(Icon.copyCheckPair(14));
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(id).then(function () {
          toast.success('UUID zkopírováno');
          Icon.flashCopied(btn, null, '', '');
        });
      });
      row.appendChild(span); row.appendChild(btn);
      list.appendChild(row);
    });
  }

  function generate(version) {
    var n = Math.min(100, Math.max(1, parseInt(countInput.value, 10) || 5));
    countInput.value = n;
    var out = [];
    for (var i = 0; i < n; i++) out.push(version === 7 ? uuidV7() : uuidV4());
    render(out);
  }

  document.getElementById('uuid-v4').addEventListener('click', function () { generate(4); });
  document.getElementById('uuid-v7').addEventListener('click', function () { generate(7); });
})();