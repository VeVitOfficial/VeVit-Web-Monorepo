<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <div class="stack-sm"><label class="field-label" for="ts-style">Styl shrnutí</label>
    <select class="select" id="ts-style"><option value="odrážky" selected>Odrážky (max 6)</option><option value="krátký odstavec">Krátký odstavec</option><option value="jedna věta">Jedna věta</option></select></div>
  <textarea class="textarea" id="ts-input" rows="10" placeholder="Vložte delší text ke shrnutí…"></textarea>
  <button class="btn btn-primary btn-touch" id="ts-run" type="button"><?= icon_svg('AlignLeft', 18) ?> <span class="ts-label">Shrnout</span><span class="ts-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="ts-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="ts-error-text"></span></div>
  <div class="result-card hidden" id="ts-out">
    <div class="markdown-body" id="ts-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="ts-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Shrnutí běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>