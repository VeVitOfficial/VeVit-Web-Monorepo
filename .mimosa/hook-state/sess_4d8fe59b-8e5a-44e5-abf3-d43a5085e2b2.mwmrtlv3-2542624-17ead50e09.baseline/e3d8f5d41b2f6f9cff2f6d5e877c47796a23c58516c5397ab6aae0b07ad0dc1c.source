// AI chat — stream z /tools/api/ai/ollama (NDJSON), výstup přes VeVitMarkdown.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var messagesEl = document.getElementById('ai-messages');
  var emptyEl = document.getElementById('ai-empty');
  var input = document.getElementById('ai-input');
  var sendBtn = document.getElementById('ai-send');
  var sendIco = sendBtn.querySelector('.ico-send');
  var stopIco = sendBtn.querySelector('.ico-stop');
  var errorEl = document.getElementById('ai-error');
  var errorText = document.getElementById('ai-error-text');
  var chat = document.querySelector('.ai-chat');
  var lifecycle = document.getElementById('tool-root')._toolLifecycle;
  var newBtn = document.getElementById('ai-new');
  var connection = document.getElementById('ai-connection');

  var isLoading = false;
  var controller = null;
  var assistantContentEl = null; // aktuální bublina asistenta (.markdown-body)
  var assistantRaw = '';
  var lastPrompt = '';

  function svgIcon(name, size) {
    // Ikony Bot/User — pokud je k dispozici Icon.build, jinak fallback prázdný svg.
    if (window.Icon && Icon.build) return Icon.build(name, size);
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('width', size); s.setAttribute('height', size); s.setAttribute('viewBox', '0 0 24 24');
    return s;
  }

  function scrollBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }

  function setLoading(b) {
    isLoading = b;
    sendIco.classList.toggle('hidden', b);
    stopIco.classList.toggle('hidden', !b);
    input.disabled = b;
    connection.lastChild.textContent = b ? ToolUI.t('state_processing') : ToolUI.t('state_ready');
    connection.classList.toggle('is-active', b);
    if (b) lifecycle.setState('processing');
    else if (document.getElementById('tool-root').dataset.toolState !== 'error') lifecycle.setState(assistantRaw ? 'success' : 'ready');
  }

  function showError(msg) { errorText.textContent = msg; errorEl.classList.remove('hidden'); }
  function hideError() { errorEl.classList.add('hidden'); }

  function renderMarkdown(text) {
    if (!window.VeVitMarkdown || !window.VeVitMarkdown.renderInto(assistantContentEl, text)) {
      showError(ToolUI.t('unknown_error'));
      return;
    }
    assistantContentEl.querySelectorAll('pre').forEach(function (block) {
      if (block.querySelector('.code-copy')) return;
      var code = block.querySelector('code'); if (!code) return;
      var button = document.createElement('button'); button.type = 'button'; button.className = 'btn btn-ghost btn-sm code-copy'; button.textContent = ToolUI.t('copy');
      button.addEventListener('click', function () { ToolUI.copyText(code.textContent); }); block.appendChild(button);
    });
  }

  function addUserMsg(text) {
    emptyEl.style.display = 'none';
    var row = document.createElement('div'); row.className = 'msg user';
    var bubble = document.createElement('div'); bubble.className = 'bubble';
    var p = document.createElement('p'); p.textContent = text; // uživatelský vstup — textContent (XSS-safe)
    bubble.appendChild(p);
    var avatar = document.createElement('div'); avatar.className = 'avatar user';
    avatar.appendChild(svgIcon('User', 16));
    row.appendChild(bubble); row.appendChild(avatar);
    messagesEl.appendChild(row);
    scrollBottom();
  }

  function addAssistantMsg() {
    var row = document.createElement('div'); row.className = 'msg bot';
    var avatar = document.createElement('div'); avatar.className = 'avatar bot';
    avatar.appendChild(svgIcon('Bot', 16));
    var bubble = document.createElement('div'); bubble.className = 'bubble';
    var content = document.createElement('div'); content.className = 'markdown-body';
    bubble.appendChild(content);
    var actions = document.createElement('div'); actions.className = 'msg-actions';
    var copy = document.createElement('button'); copy.type = 'button'; copy.className = 'btn btn-ghost btn-sm'; copy.textContent = chat.dataset.copyLabel;
    copy.addEventListener('click', function () { ToolUI.copyText(content.innerText); });
    var retry = document.createElement('button'); retry.type = 'button'; retry.className = 'btn btn-ghost btn-sm'; retry.textContent = chat.dataset.retryLabel;
    retry.addEventListener('click', function () { if (!isLoading && lastPrompt) send(lastPrompt); });
    actions.appendChild(copy); actions.appendChild(retry); bubble.appendChild(actions);
    row.appendChild(avatar); row.appendChild(bubble);
    messagesEl.appendChild(row);
    assistantContentEl = content;
    assistantRaw = '';
    scrollBottom();
  }

  function addThinking() {
    var row = document.createElement('div'); row.className = 'msg bot'; row.id = 'ai-thinking';
    var avatar = document.createElement('div'); avatar.className = 'avatar bot';
    var bubble = document.createElement('div'); bubble.className = 'ai-typing';
    var spinner = document.createElement('div'); spinner.className = 'spinner';
    bubble.appendChild(spinner);
    bubble.appendChild(document.createTextNode(ToolUI.t('thinking')));
    row.appendChild(avatar); row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
  }
  function removeThinking() { var t = document.getElementById('ai-thinking'); if (t) t.remove(); }

  async function send(prompt) {
    if (!prompt.trim() || isLoading) return;
    hideError();
    lastPrompt = prompt.trim();
    addUserMsg(prompt.trim());
    addAssistantMsg();
    addThinking();
    setLoading(true);

    controller = new AbortController();
    try {
      var res = await fetch('/tools/api/ai/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), tool: 'ai-chat', model: 'llama3.2', stream: true }),
        signal: controller.signal,
      });
      if (!res.ok) {
        var data = {}; try { data = await res.json(); } catch (e) {}
        throw new Error(data.message || data.error || ('HTTP ' + res.status));
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        var lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (!line.trim()) continue;
          try {
            var parsed = JSON.parse(line);
            if (parsed.response || parsed.text) {
              removeThinking();
              assistantRaw += parsed.response || parsed.text;
              renderMarkdown(assistantRaw);
              scrollBottom();
            }
            if (parsed.done) break;
          } catch (e) { /* ignoruj nevalidní řádek */ }
        }
      }
      if (!assistantRaw) renderMarkdown(ToolUI.t('interrupted'));
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!assistantRaw) renderMarkdown(ToolUI.t('interrupted'));
      } else {
        showError(err.message || ToolUI.t('unknown_error'));
        if (!assistantRaw && assistantContentEl) assistantContentEl.parentElement.parentElement.remove();
      }
    } finally {
      removeThinking();
      setLoading(false);
      controller = null;
    }
  }

  function submit() {
    if (isLoading) { if (controller) controller.abort(); return; }
    var text = input.value;
    if (!text.trim()) return;
    input.value = '';
    send(text);
  }

  sendBtn.addEventListener('click', submit);
  document.querySelectorAll('.ai-starter').forEach(function (button) { button.addEventListener('click', function () { input.value = button.textContent; input.focus(); lifecycle.setState('ready'); }); });
  newBtn.addEventListener('click', function () {
    if (controller) controller.abort();
    Array.prototype.forEach.call(messagesEl.querySelectorAll('.msg'), function (node) { node.remove(); });
    emptyEl.style.display = ''; input.value = ''; assistantRaw = ''; lastPrompt = ''; hideError(); lifecycle.setState('idle'); input.focus();
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
  });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px'; });
})();
