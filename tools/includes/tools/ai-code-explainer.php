<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem"><?= e(vv_t('ai_code_explainer.model_label', $lang)) ?> <?= e(ollama_model()) ?></span></div>
  <textarea class="textarea" id="ce-input" rows="12" placeholder="<?= e(vv_t('ai_code_explainer.placeholder_input', $lang)) ?>" style="font-family:var(--mono,monospace);font-size:0.85rem"></textarea>
  <button class="btn btn-primary btn-touch" id="ce-run" type="button"><?= icon_svg('FileCode', 18) ?> <span class="ce-label"><?= e(vv_t('ai_code_explainer.explain_btn', $lang)) ?></span><span class="ce-stop hidden"><?= e(vv_t('ai_code_explainer.stop', $lang)) ?></span></button>
  <div class="ai-error hidden" id="ce-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="ce-error-text"></span></div>
  <div class="result-card hidden" id="ce-out">
    <div class="markdown-body" id="ce-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="ce-copy" type="button"><?= icon_svg('Copy', 14) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('ai_code_explainer.note', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
