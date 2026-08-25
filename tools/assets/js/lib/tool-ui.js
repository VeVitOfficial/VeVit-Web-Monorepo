// Sdílený modul pro nástroje pracující se soubory a formuláři (Fáze 1+).
// Bezpečnost: žádné innerHTML s nedůvěryhodným vstupem. Názvy souborů a měřené
// hodnoty se do DOMu vkládají výhradně přes textContent. Konstantní SVG ikony
// (Upload/X/File) se vkládají innerHTML jako bezpečné literály (jako toast.js).
(function () {
  'use strict';

  // ── Pomocné formátování ────────────────────────────────────────
  function fmtSize(bytes) {
    if (bytes == null || isNaN(bytes)) return '—';
    var units = ['B', 'kB', 'MB', 'GB'];
    var b = Math.max(0, bytes);
    var i = 0;
    while (b >= 1024 && i < units.length - 1) { b /= 1024; i++; }
    return (i === 0 ? b : b.toFixed(b >= 100 ? 0 : 1)) + ' ' + units[i];
  }

  function el(id) { return document.getElementById(id); }

  // Ikony v JS se buildí přes createElementNS (window.Icon), nikoliv innerHTML.
  function icon(name, size) {
    return window.Icon ? Icon.build(name, size) : document.createElement('span');
  }

  // ── Schránka + stahování ────────────────────────────────────────
  function copyText(text) {
    if (!text) return Promise.resolve();
    return navigator.clipboard.writeText(text).then(function () {
      if (window.toast) toast.success('Zkopírováno do schránky');
    }, function () {
      if (window.toast) toast.error('Kopírování selhalo');
    });
  }

  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ── Dropzone (drag&drop + klik + volitelně paste) ──────────────
  // opts: { accept: ['.pdf'], multiple: bool, paste: bool, onFiles: fn, onError: fn }
  function dropzone(zone, opts) {
    var input = document.createElement('input');
    input.type = 'file';
    input.className = 'hidden';
    if (opts.multiple) input.multiple = true;
    if (opts.accept) input.accept = opts.accept.join(',');
    zone.appendChild(input);

    function handle(list) {
      var arr = [];
      for (var i = 0; i < list.length; i++) arr.push(list[i]);
      if (!arr.length) return;
      if (!opts.multiple) arr = [arr[0]];
      var accepted = arr;
      if (opts.accept && opts.accept.length) {
        accepted = arr.filter(function (f) { return matchesAccept(f, opts.accept); });
        var rejected = arr.length - accepted.length;
        if (rejected > 0 && opts.onError) {
          opts.onError('Některé soubory byly přeskočeny (nepovolený typ).');
        }
      }
      if (accepted.length && opts.onFiles) opts.onFiles(accepted);
    }

    function matchesAccept(file, accept) {
      var name = file.name.toLowerCase();
      return accept.some(function (a) {
        if (a.indexOf('.') === 0) return name.endsWith(a);
        if (a.indexOf('/') > -1) return file.type === a || (a.endsWith('/*') && file.type.indexOf(a.slice(0, -1)) === 0);
        return false;
      });
    }

    zone.addEventListener('click', function (e) {
      if (e.target.closest('.dz-noopen')) return;
      input.click();
    });
    input.addEventListener('change', function () { handle(input.files); input.value = ''; });

    ['dragenter', 'dragover'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault(); e.stopPropagation();
        zone.classList.add('dragover');
      });
    });
    ['dragleave', 'dragend'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) {
        e.preventDefault(); e.stopPropagation();
        if (e.target === zone) zone.classList.remove('dragover');
      });
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault(); e.stopPropagation();
      zone.classList.remove('dragover');
      handle(e.dataTransfer.files);
    });

    if (opts.paste) {
      document.addEventListener('paste', function (e) {
        if (!document.body.contains(zone)) return;
        var files = e.clipboardData && e.clipboardData.files;
        if (files && files.length) { e.preventDefault(); handle(files); }
      });
    }

    return { input: input, handle: handle };
  }

  // ── Seznam souborů s tlačítkem odebrat (volitelně i přesouvání) ──
  // files: pole s .name a .size. onRemove(index). opts.reorder → onMove(i, dir).
  function renderFileList(container, files, onRemove, opts) {
    while (container.firstChild) container.removeChild(container.firstChild);
    opts = opts || {};
    if (!files.length) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    files.forEach(function (f, i) {
      var item = document.createElement('div');
      item.className = 'file-item';

      var ico = document.createElement('span');
      ico.className = 'fi-ico';
      ico.appendChild(icon('File', 18));
      item.appendChild(ico);

      var meta = document.createElement('span');
      meta.className = 'fi-meta';
      var name = document.createElement('span');
      name.className = 'fi-name';
      name.textContent = f.name; // uživatelský vstup → textContent
      var size = document.createElement('span');
      size.className = 'fi-size';
      size.textContent = fmtSize(f.size);
      meta.appendChild(name);
      meta.appendChild(size);
      item.appendChild(meta);

      if (opts.reorder && onMoveAvailable(opts, i, files.length)) {
        var up = document.createElement('button');
        up.type = 'button';
        up.className = 'btn btn-ghost btn-icon-sm fi-move dz-noopen';
        up.setAttribute('aria-label', 'Přesunout ' + f.name + ' výše');
        up.disabled = i === 0;
        up.appendChild(chevUp());
        up.addEventListener('click', function () { opts.onMove(i, -1); });
        var down = document.createElement('button');
        down.type = 'button';
        down.className = 'btn btn-ghost btn-icon-sm fi-move dz-noopen';
        down.setAttribute('aria-label', 'Přesunout ' + f.name + ' dolů');
        down.disabled = i === files.length - 1;
        down.appendChild(chevDown());
        down.addEventListener('click', function () { opts.onMove(i, 1); });
        item.appendChild(up);
        item.appendChild(down);
      }

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn btn-ghost btn-icon-sm fi-remove dz-noopen';
      rm.setAttribute('aria-label', 'Odebrat ' + f.name);
      rm.appendChild(icon('X', 16));
      rm.addEventListener('click', function () { onRemove(i); });
      item.appendChild(rm);

      container.appendChild(item);
    });
  }

  function onMoveAvailable(opts, i, len) {
    return typeof opts.onMove === 'function';
  }
  function chevUp() {
    if (!window.Icon) return document.createElement('span');
    var svg = Icon.build('ChevronDown', 16);
    svg.style.transform = 'rotate(180deg)';
    return svg;
  }
  function chevDown() {
    return window.Icon ? Icon.build('ChevronDown', 16) : document.createElement('span');
  }

  // ── Progress bar (track obsahuje .progress-fill a .progress-label) ──
  function setProgress(track, pct, label) {
    var fill = track.querySelector('.progress-fill');
    var lbl = track.querySelector('.progress-label');
    var p = Math.max(0, Math.min(100, pct));
    if (fill) fill.style.width = p + '%';
    if (lbl) {
      lbl.textContent = (label != null ? label : Math.round(p) + ' %');
      lbl.setAttribute('aria-live', 'polite');
    }
  }

  // ── Líné načtení lokálně vendored UMD skriptu (jen na stránkách, co ho potřebují) ──
  var _loading = {};
  function loadScript(src) {
    if (_loading[src]) return _loading[src];
    _loading[src] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve;
      s.onerror = function () { delete _loading[src]; reject(new Error('Nelze načíst ' + src)); };
      document.head.appendChild(s);
    });
    return _loading[src];
  }

  // ── localStorage paměť vstupů ──────────────────────────────────
  function persist(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }
  function restore(key, fallback) {
    try { var v = localStorage.getItem(key); return v == null ? fallback : v; } catch (_) { return fallback; }
  }

  // Wire copy tlačítka s dvojitou Copy/Check ikonou (jako json-formatter).
  function wireCopy(btn, getValue, doneText, resetText) {
    if (!btn) return;
    var label = btn.querySelector('.label');
    btn.addEventListener('click', function () {
      var v = getValue();
      if (!v) return;
      copyText(v).then(function () {
        if (window.Icon) Icon.flashCopied(btn, label, doneText || 'Zkopírováno', resetText || 'Kopírovat');
      });
    });
  }

  window.ToolUI = {
    fmtSize: fmtSize,
    el: el,
    icon: icon,
    copyText: copyText,
    download: download,
    dropzone: dropzone,
    renderFileList: renderFileList,
    setProgress: setProgress,
    loadScript: loadScript,
    persist: persist,
    restore: restore,
    wireCopy: wireCopy
  };
})();