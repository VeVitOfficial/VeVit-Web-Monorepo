<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem"><?= e(vv_t('tool_common.model', $lang)) ?>: <?= e(ollama_model()) ?></span></div>
  <div class="stack-sm"><label class="field-label" for="ts-style"><?= e(vv_t('summarize_text.style', $lang)) ?></label>
    <select class="select" id="ts-style"><option value="odrážky" selected><?= e(vv_t('summarize_text.style_bullets', $lang)) ?></option><option value="krátký odstavec"><?= e(vv_t('summarize_text.style_paragraph', $lang)) ?></option><option value="jedna věta"><?= e(vv_t('summarize_text.style_sentence', $lang)) ?></option></select></div>
  <textarea class="textarea" id="ts-input" rows="10" placeholder="<?= e(vv_t('summarize_text.ph', $lang)) ?>"></textarea>
  <button class="btn btn-primary btn-touch" id="ts-run" type="button"><?= icon_svg('AlignLeft', 18) ?> <span class="ts-label"><?= e(vv_t('summarize_text.run', $lang)) ?></span><span class="ts-stop hidden"><?= e(vv_t('tool_common.stop', $lang)) ?></span></button>
  <div class="ai-error hidden" id="ts-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="ts-error-text"></span></div>
  <div class="result-card hidden" id="ts-out">
    <div class="markdown-body" id="ts-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="ts-copy" type="button"><?= icon_svg('Copy', 14) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('summarize_text.footer', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>