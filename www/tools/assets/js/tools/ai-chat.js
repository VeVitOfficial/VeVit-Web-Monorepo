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

  var isLoading = false;
  var controller = null;
  var assistantContentEl = null; // aktuální bublina asistenta (.markdown-body)
  var assistantRaw = '';

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
  }

  function showError(msg) { errorText.textContent = msg; errorEl.classList.remove('hidden'); }
  function hideError() { errorEl.classList.add('hidden'); }

  function renderMarkdown(text) {
    if (!window.VeVitMarkdown || !window.VeVitMarkdown.renderInto(assistantContentEl, text)) {
      showError('Odpověď nelze bezpečně vykreslit.');
    }
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
    bubble.appendChild(document.createTextNode('Přemýšlím...'));
    row.appendChild(avatar); row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
  }
  function removeThinking() { var t = document.getElementById('ai-thinking'); if (t) t.remove(); }

  async function send(prompt) {
    if (!prompt.trim() || isLoading) return;
    hideError();
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
      if (!assistantRaw) renderMarkdown('_Přerušeno uživatelem._');
    } catch (err) {
      if (err.name === 'AbortError') {
        if (!assistantRaw) renderMarkdown('_Přerušeno uživatelem._');
      } else {
        showError(err.message || 'Neznámá chyba');
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
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
})();
