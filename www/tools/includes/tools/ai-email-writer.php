<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <textarea class="textarea" id="ew-input" rows="6" placeholder="Popište, o jaký e-mail jde (komu, o čem, co chcete sdělit)…"></textarea>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="ew-tone">Tón</label>
      <select class="select" id="ew-tone"><option value="formální" selected>Formální</option><option value="přátelský">Přátelský</option><option value="prodejní">Prodejní</option><option value="omluvný">Omluvný</option><option value="stručný">Stručný</option></select></div>
    <div class="stack-sm"><label class="field-label" for="ew-lang">Jazyk</label>
      <select class="select" id="ew-lang"><option value="čeština" selected>čeština</option><option value="angličtina">angličtina</option><option value="slovenština">slovenština</option><option value="němčina">němčina</option></select></div>
  </div>
  <button class="btn btn-primary btn-touch" id="ew-run" type="button"><?= icon_svg('Mail', 18) ?> <span class="ew-label">Napsat e-mail</span><span class="ew-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="ew-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="ew-error-text"></span></div>
  <div class="result-card hidden" id="ew-out">
    <div class="markdown-body" id="ew-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="ew-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button></div>
  </div>
  <p class="muted" style="font-size:0.8rem">E-mail se vygeneruje lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
