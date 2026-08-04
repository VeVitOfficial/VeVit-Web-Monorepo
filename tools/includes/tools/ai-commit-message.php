<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <textarea class="textarea" id="cm-input" rows="10" placeholder="Vložte git diff nebo seznam změn (git diff --staged)…" style="font-family:var(--mono,monospace);font-size:0.85rem"></textarea>
  <button class="btn btn-primary btn-touch" id="cm-run" type="button"><?= icon_svg('GitCommit', 18) ?> <span class="cm-label">Vygenerovat</span><span class="cm-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="cm-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="cm-error-text"></span></div>
  <div class="result-card hidden" id="cm-out">
    <div class="markdown-body" id="cm-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="cm-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Vygeneruje commit zprávu ve formátu Conventional Commits. Běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>