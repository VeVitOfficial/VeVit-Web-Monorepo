<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <div class="stack-sm"><label class="field-label" for="qa-ctx">Kontext (text, nad kterým se ptáte)</label>
    <textarea class="textarea" id="qa-ctx" rows="8" placeholder="Vložte text, ze kterého má AI odpovídat…"></textarea></div>
  <div class="stack-sm"><label class="field-label" for="qa-q">Otázka</label>
    <textarea class="textarea" id="qa-q" rows="3" placeholder="Na co se chcete zeptat?"></textarea></div>
  <button class="btn btn-primary btn-touch" id="qa-run" type="button"><?= icon_svg('HelpCircle', 18) ?> <span class="qa-label">Zeptat se</span><span class="qa-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="qa-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="qa-error-text"></span></div>
  <div class="result-card hidden" id="qa-out">
    <div class="markdown-body" id="qa-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="qa-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Odpovídá pouze z dodaného kontextu (ne vymýšlí). Běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
