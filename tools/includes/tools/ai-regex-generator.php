<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem"><?= e(vv_t('tool_common.model', $lang)) ?>: <?= e(ollama_model()) ?></span></div>
  <textarea class="textarea" id="rg-input" rows="5" placeholder="<?= e(vv_t('ai_regex_generator.placeholder', $lang)) ?>"></textarea>
  <button class="btn btn-primary btn-touch" id="rg-run" type="button"><?= icon_svg('Regex', 18) ?> <span class="rg-label"><?= e(vv_t('ai_regex_generator.run', $lang)) ?></span><span class="rg-stop hidden"><?= e(vv_t('tool_common.stop', $lang)) ?></span></button>
  <div class="ai-error hidden" id="rg-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="rg-error-text"></span></div>
  <div class="result-card hidden" id="rg-out">
    <div class="markdown-body" id="rg-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="rg-copy" type="button"><?= icon_svg('Copy', 14) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('ai_regex_generator.footer', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
