<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <textarea class="textarea" id="seo-input" rows="10" placeholder="Vložte obsah stránky (nebo klíčová slova)…"></textarea>
  <button class="btn btn-primary btn-touch" id="seo-run" type="button"><?= icon_svg('Search', 18) ?> <span class="seo-label">Vygenerovat meta</span><span class="seo-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="seo-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="seo-error-text"></span></div>
  <div class="result-card hidden" id="seo-out">
    <div class="markdown-body" id="seo-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="seo-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Vygeneruje SEO title (≤60 znaků) a meta description (≤155 znaků). Běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>