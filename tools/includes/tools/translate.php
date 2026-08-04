<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="tt-src">Z jazyka</label>
      <select class="select" id="tt-src"><option value="auto" selected>Auto</option><option value="čeština">čeština</option><option value="angličtina">angličtina</option><option value="slovenština">slovenština</option><option value="němčina">němčina</option><option value="francouzština">francouzština</option><option value="španělština">španělština</option><option value="ruština">ruština</option><option value="polština">polština</option><option value="italština">italština</option></select></div>
    <div class="stack-sm"><label class="field-label" for="tt-tgt">Do jazyka</label>
      <select class="select" id="tt-tgt"><option value="čeština" selected>čeština</option><option value="angličtina">angličtina</option><option value="slovenština">slovenština</option><option value="němčina">němčina</option><option value="francouzština">francouzština</option><option value="španělština">španělština</option><option value="ruština">ruština</option><option value="polština">polština</option><option value="italština">italština</option></select></div>
  </div>
  <textarea class="textarea" id="tt-input" rows="8" placeholder="Vložte text k překladu…"></textarea>
  <button class="btn btn-primary btn-touch" id="tt-run" type="button"><?= icon_svg('Languages', 18) ?> <span class="tt-label">Přeložit</span><span class="tt-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="tt-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="tt-error-text"></span></div>
  <div class="result-card hidden" id="tt-out">
    <div class="markdown-body" id="tt-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem">
      <button class="btn btn-secondary btn-sm" id="tt-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem">Překlad běží lokálně přes Ollamu. Text se nikam neodesílá mimo váš počítač/server. Vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>