// Konverze barev — HEX / RGB / HSL.
(function () {
  var hexEl = document.getElementById('cc-hex');
  var rgbEl = document.getElementById('cc-rgb');
  var hslEl = document.getElementById('cc-hsl');
  var swatch = document.getElementById('cc-swatch');
  var hexDisplay = document.getElementById('cc-hex-display');

  function parseHex(h) {
    var clean = h.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function updateFromHex(value) {
    hexEl.value = value;
    var parsed = parseHex(value);
    if (!parsed) return;
    var r = parsed.r, g = parsed.g, b = parsed.b;
    rgbEl.value = r + ', ' + g + ', ' + b;
    var hsl = rgbToHsl(r, g, b);
    hslEl.value = hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%';
    swatch.style.background = value;
    hexDisplay.textContent = value.toUpperCase();
  }

  hexEl.addEventListener('input', function () { updateFromHex(hexEl.value); });

  document.querySelectorAll('.cc-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.key;
      var val = (key === 'hex' ? hexEl : key === 'rgb' ? rgbEl : hslEl).value;
      navigator.clipboard.writeText(val).then(function () {
        toast.success('Zkopírováno');
        Icon.flashCopied(btn, null, '', '');
      });
    });
  });

  // Inicializace.
  updateFromHex('#10b981');
})();