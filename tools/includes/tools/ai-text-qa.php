<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem"><?= e(vv_t('tool_common.model', $lang)) ?>: <?= e(ollama_model()) ?></span></div>
  <div class="stack-sm"><label class="field-label" for="qa-ctx"><?= e(vv_t('ai_text_qa.context_label', $lang)) ?></label>
    <textarea class="textarea" id="qa-ctx" rows="8" placeholder="<?= e(vv_t('ai_text_qa.context_placeholder', $lang)) ?>"></textarea></div>
  <div class="stack-sm"><label class="field-label" for="qa-q"><?= e(vv_t('ai_text_qa.question_label', $lang)) ?></label>
    <textarea class="textarea" id="qa-q" rows="3" placeholder="<?= e(vv_t('ai_text_qa.question_placeholder', $lang)) ?>"></textarea></div>
  <button class="btn btn-primary btn-touch" id="qa-run" type="button"><?= icon_svg('HelpCircle', 18) ?> <span class="qa-label"><?= e(vv_t('ai_text_qa.run', $lang)) ?></span><span class="qa-stop hidden"><?= e(vv_t('tool_common.stop', $lang)) ?></span></button>
  <div class="ai-error hidden" id="qa-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="qa-error-text"></span></div>
  <div class="result-card hidden" id="qa-out">
    <div class="markdown-body" id="qa-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="qa-copy" type="button"><?= icon_svg('Copy', 14) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('ai_text_qa.footer', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
