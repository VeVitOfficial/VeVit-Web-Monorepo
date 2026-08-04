<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <textarea class="textarea" id="gc-input" rows="10" placeholder="Vložte český text k opravě pravopisu a gramatiky…"></textarea>
  <button class="btn btn-primary btn-touch" id="gc-run" type="button"><?= icon_svg('SpellCheck', 18) ?> <span class="gc-label">Opravit</span><span class="gc-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="gc-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="gc-error-text"></span></div>
  <div class="result-card hidden" id="gc-out">
    <div class="markdown-body" id="gc-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="gc-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Kontrola pravopisu/gramatiky přes Ollamu, lokálně. Vraťte opravený text — vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>