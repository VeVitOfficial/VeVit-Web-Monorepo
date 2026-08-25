// Prohlížeč/odstraňovač EXIF metadat, čistě client-side (exifr lazy-load).
(function () {
  'use strict';
  var drop = ToolUI.el('ex-drop'), work = ToolUI.el('ex-work'), data = ToolUI.el('ex-data');
  var remove = ToolUI.el('ex-remove'), err = ToolUI.el('ex-error');
  var file = null, img = null;

  function fail(m) { err.textContent = m; err.classList.remove('hidden'); }
  function clearErr() { err.classList.add('hidden'); err.textContent = ''; }
  function row(k, v) { var d = document.createElement('div'); d.className = 'kv'; d.innerHTML = ''; var s = document.createElement('span'); s.className = 'k'; s.textContent = k; var val = document.createElement('span'); val.className = 'v mono'; val.textContent = v == null ? '—' : String(v); d.appendChild(s); d.appendChild(val); return d; }

  function ensure(cb) {
    if (window.exifr) return cb();
    ToolUI.loadScript('/tools/assets/js/lib/exifr.umd.js', function (ok) { if (!ok || !window.exifr) return fail('Knihovnu exifr se nepodařilo načíst.'); cb(); });
  }

  function gpsWarn(hasGps) {
    if (!hasGps) return null;
    var p = document.createElement('p'); p.className = 'error-text'; p.style.color = '#fbbf24';
    p.textContent = '⚠ Tato fotografie obsahuje GPS souřadnice — metadata mohou prozrazovat vaši polohu.';
    return p;
  }

  function fmtGps(lat, lon) {
    if (lat == null && lon == null) return null;
    function dms(v, pos) { var d = Math.abs(v), deg = Math.floor(d), min = Math.floor((d - deg) * 60), sec = ((d - deg) * 60 - min) * 60; return deg + '° ' + min + "' " + sec.toFixed(1) + '" ' + (v >= 0 ? pos[0] : pos[1]); }
    return (lat != null ? dms(lat, 'NS') + '  ' : '') + (lon != null ? dms(lon, 'EW') : '');
  }

  function load() {
    data.textContent = ''; data.appendChild((function () { var p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Načítám metadata…'; return p; })());
    ensure(function () {
      window.exifr.parse(file, { tiff: true, exif: true, gps: true, iptc: true, jfif: true }).then(function (o) {
        data.textContent = '';
        if (!o || !Object.keys(o).length) { data.appendChild((function () { var p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Obrázek neobsahuje žádná čitelná metadata (nebo není JPEG).'; return p; })()); return; }
        var fields = [
          ['Výrobce', o.Make], ['Model', o.Model], ['Software', o.Software],
          ['Datum a čas', o.DateTimeOriginal || o.CreateDate],
          ['ISO', o.ISO], ['Clona (f/)', o.FNumber && 'f/' + o.FNumber], ['Expozice', o.ExposureTime && (o.ExposureTime >= 1 ? o.ExposureTime + 's' : '1/' + Math.round(1 / o.ExposureTime) + 's')],
          ['Ohnisková vzdálenost', o.FocalLength && o.FocalLength + ' mm'], ['Šířka × výška', (o.ImageWidth || o.ExifImageWidth) && (o.ImageWidth || o.ExifImageWidth) + '×' + (o.ImageHeight || o.ExifImageHeight)],
          ['Orientace', o.Orientation && ('Otočení ' + o.Orientation)],
          ['GPS', fmtGps(o.latitude, o.longitude)]
        ];
        fields.forEach(function (f) { if (f[1]) data.appendChild(row(f[0], f[1])); });
        var w = gpsWarn(o.latitude != null || o.longitude != null); if (w) data.appendChild(w);
        remove.disabled = false;
      }).catch(function (e) { fail('Čtení metadat selhalo: ' + e.message); });
    });
  }

  ToolUI.dropzone(drop, {
    accept: ['image/jpeg', 'image/png', 'image/webp'], multiple: false,
    onFiles: function (arr) {
      clearErr();
      file = arr[0];
      if (file.size > 25 * 1024 * 1024) return fail('Obrázek je příliš velký (max 25 MB).');
      work.classList.remove('hidden'); remove.disabled = true;
      load();
    },
    onError: fail
  });

  remove.addEventListener('click', function () {
    if (!file) return;
    img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      var cx = c.getContext('2d');
      if (file.type === 'image/jpeg') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height); }
      cx.drawImage(img, 0, 0);
      var ext = (file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg');
      c.toBlob(function (b) { ToolUI.download(b, 'bez-exif.' + ext); }, file.type === 'image/jpeg' ? 'image/jpeg' : (file.type || 'image/jpeg'), 0.92);
    };
    img.src = URL.createObjectURL(file);
  });
})();