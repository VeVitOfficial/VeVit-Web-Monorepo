// Sdílený modul pro nástroje pracující se soubory a formuláři (Fáze 1+).
// Bezpečnost: žádné innerHTML s nedůvěryhodným vstupem. Názvy souborů a měřené
// hodnoty se do DOMu vkládají výhradně přes textContent. Konstantní SVG ikony
// (Upload/X/File) se vkládají innerHTML jako bezpečné literály (jako toast.js).
(function () {
  'use strict';

  var dictionary = {};
  var dictionaryNode = document.getElementById('tool-ui-i18n');
  if (dictionaryNode) {
    try { dictionary = JSON.parse(dictionaryNode.textContent || '{}'); } catch (_) {}
  }

  function t(key, vars) {
    var value = dictionary[key] || key;
    Object.keys(vars || {}).forEach(function (name) {
      value = value.replace(new RegExp('\\{' + name + '\\}', 'g'), String(vars[name]));
    });
    return value;
  }

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
    var operation = navigator.clipboard && navigator.clipboard.writeText
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error('Clipboard API unavailable'));
    return operation.then(function () {
      if (window.toast) toast.success(t('copied'));
    }, function () {
      if (window.toast) toast.error(t('copy_failed'));
    });
  }

  function forceDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Zpracování už nikdy nespustí překvapivé stažení. Staré controllery mohou
  // dál volat ToolUI.download(); helper jejich výsledek převede na jednotnou
  // kartu s explicitním tlačítkem.
  function download(blob, filename) {
    var root = el('tool-root');
    if (!root) { forceDownload(blob, filename); return; }
    var container = root.querySelector('.tool-auto-result');
    if (!container) {
      container = document.createElement('div');
      container.className = 'tool-auto-result hidden';
      root.appendChild(container);
    }
    resultCard(container, { blob: blob, filename: filename, size: blob && blob.size });
    container.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }

  // ── Dropzone (drag&drop + klik + volitelně paste) ──────────────
  // opts: { accept, multiple, paste, maxSize, onFiles, onError }
  function dropzone(zone, opts) {
    opts = opts || {};
    if (!opts.maxSize) {
      var shell = zone.closest('[data-tool-category]');
      var category = shell ? shell.dataset.toolCategory : '';
      opts.maxSize = category === 'media' ? 100 * 1024 * 1024 : category === 'pdf' ? 100 * 1024 * 1024 : category === 'image' ? 25 * 1024 * 1024 : 50 * 1024 * 1024;
    }
    var input = document.createElement('input');
    input.type = 'file';
    input.className = 'hidden';
    if (opts.multiple) input.multiple = true;
    if (opts.accept) input.accept = opts.accept.join(',');
    zone.appendChild(input);
    if (!zone.hasAttribute('tabindex')) zone.tabIndex = 0;
    if (!zone.hasAttribute('role')) zone.setAttribute('role', 'button');
    if (!zone.hasAttribute('aria-label')) {
      var dropTitle = zone.querySelector('.dz-title');
      if (dropTitle) zone.setAttribute('aria-label', dropTitle.textContent.trim());
    }
    input.setAttribute('aria-hidden', 'true');

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
          opts.onError(t('invalid_type'));
        }
      }
      if (opts.maxSize) {
        accepted = accepted.filter(function (f) {
          if (f.size <= opts.maxSize) return true;
          if (opts.onError) opts.onError(t('file_too_large', { name: f.name, limit: fmtSize(opts.maxSize) }));
          return false;
        });
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
    zone.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
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
        up.setAttribute('aria-label', t('move_up', { name: f.name }));
        up.disabled = i === 0;
        up.appendChild(chevUp());
        up.addEventListener('click', function () { opts.onMove(i, -1); });
        var down = document.createElement('button');
        down.type = 'button';
        down.className = 'btn btn-ghost btn-icon-sm fi-move dz-noopen';
        down.setAttribute('aria-label', t('move_down', { name: f.name }));
        down.disabled = i === files.length - 1;
        down.appendChild(chevDown());
        down.addEventListener('click', function () { opts.onMove(i, 1); });
        item.appendChild(up);
        item.appendChild(down);
      }

      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'btn btn-ghost btn-icon-sm fi-remove dz-noopen';
      rm.setAttribute('aria-label', t('remove_file', { name: f.name }));
      rm.appendChild(icon('X', 16));
      rm.addEventListener('click', function () { onRemove(i); });
      item.appendChild(rm);

      container.appendChild(item);
    });
  }

  function renderFileGrid(container, files, onRemove) {
    while (container.firstChild) container.removeChild(container.firstChild);
    container.classList.add('file-grid');
    files.forEach(function (file, index) {
      var card = document.createElement('article'); card.className = 'file-grid-card';
      var preview = document.createElement('div'); preview.className = 'file-grid-preview';
      preview.appendChild(icon('File', 24));
      var name = document.createElement('strong'); name.textContent = file.name;
      var meta = document.createElement('span'); meta.textContent = t('file_format', { type: file.type || 'file', size: fmtSize(file.size) });
      var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'btn btn-ghost btn-sm'; remove.textContent = '×'; remove.setAttribute('aria-label', t('remove_file', { name: file.name }));
      remove.addEventListener('click', function () { onRemove(index); });
      card.appendChild(preview); card.appendChild(name); card.appendChild(meta); card.appendChild(remove); container.appendChild(card);
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
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    if (pct == null) {
      track.classList.add('is-indeterminate');
      track.removeAttribute('aria-valuenow');
      if (lbl && label != null) lbl.textContent = label;
      return;
    }
    track.classList.remove('is-indeterminate');
    var p = Math.max(0, Math.min(100, pct));
    if (fill) fill.style.width = p + '%';
    track.setAttribute('aria-valuenow', String(Math.round(p)));
    if (lbl) {
      lbl.textContent = (label != null ? label : Math.round(p) + ' %');
      lbl.setAttribute('aria-live', 'polite');
    }
  }

  // ── Líné načtení lokálně vendored UMD skriptu (jen na stránkách, co ho potřebují) ──
  var _loading = {};
  function loadScript(src, callback) {
    if (!_loading[src]) _loading[src] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve;
      s.onerror = function () { delete _loading[src]; reject(new Error(t('load_failed'))); };
      document.head.appendChild(s);
    });
    if (typeof callback === 'function') {
      _loading[src].then(function () { callback(true); }, function () { callback(false); });
    }
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
        if (window.Icon) Icon.flashCopied(btn, label, doneText || t('copied'), resetText || t('copy'));
      });
    });
  }

  // ── Unified lifecycle, cancellation and resource cleanup ──────
  function lifecycle(root) {
    root = root || el('tool-root');
    var cleanups = [];
    var controller = null;
    var live = el('tool-live-status');
    var stepMap = { idle: 'input', ready: 'settings', processing: 'settings', success: 'result', error: 'settings' };

    function announce(message) {
      if (!live || !message) return;
      live.textContent = '';
      window.setTimeout(function () { live.textContent = message; }, 20);
    }

    function setState(state, message) {
      if (!root) return;
      root.dataset.toolState = state;
      root.setAttribute('aria-busy', state === 'processing' ? 'true' : 'false');
      document.querySelectorAll('[data-tool-step]').forEach(function (step) {
        var active = step.dataset.toolStep === stepMap[state];
        step.classList.toggle('is-current', active);
        if (active) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
      });
      announce(message || t('state_' + state));
      root.dispatchEvent(new CustomEvent('toolstatechange', { detail: { state: state } }));
    }

    function abort() {
      if (controller) controller.abort();
      controller = null;
      setState('ready');
    }

    function signal() {
      if (controller) controller.abort();
      controller = new AbortController();
      return controller.signal;
    }

    function addCleanup(fn) {
      if (typeof fn === 'function') cleanups.push(fn);
      return fn;
    }

    function objectUrl(value) {
      var url = URL.createObjectURL(value);
      addCleanup(function () { URL.revokeObjectURL(url); });
      return url;
    }

    function cleanup() {
      abort();
      cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (_) {} });
    }

    window.addEventListener('pagehide', cleanup, { once: true });
    return { setState: setState, announce: announce, abort: abort, signal: signal, addCleanup: addCleanup, objectUrl: objectUrl, cleanup: cleanup };
  }

  function showError(node, message) {
    if (!node) return;
    node.textContent = message;
    node.classList.remove('hidden');
    node.setAttribute('role', 'alert');
    var root = el('tool-root');
    if (root && root._toolLifecycle) root._toolLifecycle.setState('error', message);
  }

  function clearError(node) {
    if (!node) return;
    node.textContent = '';
    node.classList.add('hidden');
  }

  function resultCard(container, options) {
    options = options || {};
    while (container.firstChild) container.removeChild(container.firstChild);
    container.classList.add('result-card');
    var mark = document.createElement('span');
    mark.className = 'result-card-icon';
    mark.appendChild(icon('Check', 20));
    var meta = document.createElement('span');
    meta.className = 'rc-meta';
    var title = document.createElement('strong');
    title.className = 'rc-title';
    title.textContent = options.title || t('result_ready');
    var sub = document.createElement('span');
    sub.className = 'rc-sub';
    sub.textContent = [options.filename, options.size != null ? fmtSize(options.size) : ''].filter(Boolean).join(' · ');
    meta.appendChild(title); meta.appendChild(sub);
    container.appendChild(mark); container.appendChild(meta);
    if (options.blob) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-primary btn-touch';
      button.appendChild(icon('Download', 17));
      var label = document.createElement('span');
      label.textContent = options.downloadLabel || t('download');
      button.appendChild(label);
      button.addEventListener('click', function () { forceDownload(options.blob, options.filename || 'download'); });
      container.appendChild(button);
    }
    var again = document.createElement('button');
    again.type = 'button'; again.className = 'btn btn-outline btn-touch'; again.textContent = t('reset');
    again.addEventListener('click', function () {
      container.classList.add('hidden');
      var root = el('tool-root');
      if (root && root._toolLifecycle) root._toolLifecycle.setState('ready');
      var target = root && root.querySelector('.dropzone, input:not([type="hidden"]), textarea, select');
      if (target) target.focus();
      if (root) root.dispatchEvent(new CustomEvent('toolrepeatrequest'));
    });
    container.appendChild(again);
    container.classList.remove('hidden');
    var root = el('tool-root');
    if (root && root._toolLifecycle) root._toolLifecycle.setState('success');
    return container;
  }

  function boot() {
    var root = el('tool-root');
    if (!root || root._toolLifecycle) return;
    root._toolLifecycle = lifecycle(root);
    root._toolLifecycle.setState('idle');
    root.querySelectorAll('button:not([type])').forEach(function (button) { button.type = 'button'; });
    root.querySelectorAll('.error-text').forEach(function (node) { if (!node.hasAttribute('role')) node.setAttribute('role', 'alert'); });
    root.querySelectorAll('.progress-track').forEach(function (node) {
      node.setAttribute('role', 'progressbar'); node.setAttribute('aria-valuemin', '0'); node.setAttribute('aria-valuemax', '100');
    });
    root.querySelectorAll('.tbl-wrap').forEach(function (node) { if (!node.hasAttribute('tabindex')) node.tabIndex = 0; });
    if (root.closest('[data-tool-category="dev"], [data-tool-category="security"]')) {
      root.querySelectorAll('textarea').forEach(function (field) { if (!field.hasAttribute('spellcheck')) field.spellcheck = false; });
    }
    root.querySelectorAll('textarea:not([readonly]):not(#ai-input)').forEach(function (field) {
      if (field.nextElementSibling && field.nextElementSibling.classList.contains('editor-meta')) return;
      var meta = document.createElement('span'); meta.className = 'editor-meta tool-generated-meta';
      function update() { meta.textContent = t('text_meta', { characters: field.value.length, lines: field.value ? field.value.split('\n').length : 1 }); }
      field.insertAdjacentElement('afterend', meta); field.addEventListener('input', update); update();
    });
    root.querySelectorAll('input[type="password"]').forEach(function (field) {
      field.autocomplete = 'new-password'; field.spellcheck = false; field.setAttribute('autocapitalize', 'none');
      root._toolLifecycle.addCleanup(function () { field.value = ''; });
    });
    root.addEventListener('change', function () {
      if (root.dataset.toolState === 'idle') root._toolLifecycle.setState('ready');
    });
    root.addEventListener('drop', function () {
      window.setTimeout(function () {
        if (root.dataset.toolState === 'idle') root._toolLifecycle.setState('ready');
      }, 0);
    });
    root.addEventListener('click', function (event) {
      var button = event.target.closest('button.btn-primary');
      if (!button || button.disabled || button.closest('.result-card')) return;
      if (!/(run|apply|generate|convert|process|send)/i.test(button.id || '')) return;
      root._toolLifecycle.setState('processing');
      window.setTimeout(function () {
        if (root.dataset.toolState === 'processing' && !root.querySelector('.progress-track:not(.hidden), .spinner:not(.hidden)')) {
          root._toolLifecycle.setState('ready');
        }
      }, 800);
    });
    var errorObserver = new MutationObserver(function () {
      var visibleError = Array.prototype.find.call(root.querySelectorAll('.error-text, .ai-error'), function (node) {
        return !node.classList.contains('hidden') && node.textContent.trim();
      });
      if (visibleError) root._toolLifecycle.setState('error', visibleError.textContent.trim());
    });
    errorObserver.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class'] });
    root._toolLifecycle.addCleanup(function () { errorObserver.disconnect(); });
  }

  window.ToolUI = {
    t: t,
    fmtSize: fmtSize,
    el: el,
    icon: icon,
    copyText: copyText,
    download: download,
    dropzone: dropzone,
    renderFileList: renderFileList,
    renderFileGrid: renderFileGrid,
    setProgress: setProgress,
    loadScript: loadScript,
    persist: persist,
    restore: restore,
    wireCopy: wireCopy,
    lifecycle: lifecycle,
    showError: showError,
    clearError: clearError,
    resultCard: resultCard,
    forceDownload: forceDownload,
    boot: boot
  };
  boot();
})();
