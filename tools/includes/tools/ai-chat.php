<div class="ai-chat">
  <div class="ai-head">
    <span class="badge badge-ai">AI</span>
    <span class="muted" style="font-size:0.875rem">Model: llama3.2</span>
  </div>

  <div class="ai-messages" id="ai-messages">
    <div class="ai-empty" id="ai-empty">
      <div class="ai-empty-icon"><?= icon_svg('Bot', 40) ?></div>
      <p class="ai-empty-title">AI asistent</p>
      <p class="muted" style="font-size:0.875rem">Zeptejte se na cokoliv. Odpovědi se generují lokálně přes Ollama.</p>
    </div>
  </div>

  <div class="ai-error hidden" id="ai-error">
    <span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span>
    <span id="ai-error-text"></span>
  </div>

  <div class="ai-input">
    <textarea class="textarea" id="ai-input" placeholder="Napište zprávu..."></textarea>
    <button class="btn btn-primary btn-lg" id="ai-send" style="flex-shrink:0">
      <span class="ico ico-send"><?= icon_svg('Send', 18) ?></span>
      <span class="ico ico-stop hidden">Zastavit</span>
    </button>
  </div>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
