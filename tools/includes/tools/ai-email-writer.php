<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem"><?= e(vv_t('tool_common.model', $lang)) ?>: <?= e(ollama_model()) ?></span></div>
  <textarea class="textarea" id="ew-input" rows="6" placeholder="<?= e(vv_t('ai_email_writer.placeholder', $lang)) ?>"></textarea>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="ew-tone"><?= e(vv_t('ai_email_writer.tone', $lang)) ?></label>
      <select class="select" id="ew-tone"><option value="formální" selected><?= e(vv_t('ai_email_writer.tone_formal', $lang)) ?></option><option value="přátelský"><?= e(vv_t('ai_email_writer.tone_friendly', $lang)) ?></option><option value="prodejní"><?= e(vv_t('ai_email_writer.tone_sales', $lang)) ?></option><option value="omluvný"><?= e(vv_t('ai_email_writer.tone_apologetic', $lang)) ?></option><option value="stručný"><?= e(vv_t('ai_email_writer.tone_concise', $lang)) ?></option></select></div>
    <div class="stack-sm"><label class="field-label" for="ew-lang"><?= e(vv_t('ai_email_writer.language', $lang)) ?></label>
      <select class="select" id="ew-lang"><option value="čeština" selected><?= e(vv_t('ai_email_writer.lang_czech', $lang)) ?></option><option value="angličtina"><?= e(vv_t('ai_email_writer.lang_english', $lang)) ?></option><option value="slovenština"><?= e(vv_t('ai_email_writer.lang_slovak', $lang)) ?></option><option value="němčina"><?= e(vv_t('ai_email_writer.lang_german', $lang)) ?></option></select></div>
  </div>
  <button class="btn btn-primary btn-touch" id="ew-run" type="button"><?= icon_svg('Mail', 18) ?> <span class="ew-label"><?= e(vv_t('ai_email_writer.run', $lang)) ?></span><span class="ew-stop hidden"><?= e(vv_t('tool_common.stop', $lang)) ?></span></button>
  <div class="ai-error hidden" id="ew-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="ew-error-text"></span></div>
  <div class="result-card hidden" id="ew-out">
    <div class="markdown-body" id="ew-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="ew-copy" type="button"><?= icon_svg('Copy', 14) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('ai_email_writer.footer', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
