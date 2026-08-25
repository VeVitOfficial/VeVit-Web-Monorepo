<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem"><?= e(vv_t('translate.model_label', $lang)) ?> <?= e(ollama_model()) ?></span></div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="tt-src"><?= e(vv_t('translate.from_lang', $lang)) ?></label>
      <select class="select" id="tt-src"><option value="auto" selected><?= e(vv_t('translate.lang_auto', $lang)) ?></option><option value="čeština"><?= e(vv_t('translate.lang_czech', $lang)) ?></option><option value="angličtina"><?= e(vv_t('translate.lang_english', $lang)) ?></option><option value="slovenština"><?= e(vv_t('translate.lang_slovak', $lang)) ?></option><option value="němčina"><?= e(vv_t('translate.lang_german', $lang)) ?></option><option value="francouzština"><?= e(vv_t('translate.lang_french', $lang)) ?></option><option value="španělština"><?= e(vv_t('translate.lang_spanish', $lang)) ?></option><option value="ruština"><?= e(vv_t('translate.lang_russian', $lang)) ?></option><option value="polština"><?= e(vv_t('translate.lang_polish', $lang)) ?></option><option value="italština"><?= e(vv_t('translate.lang_italian', $lang)) ?></option></select></div>
    <div class="stack-sm"><label class="field-label" for="tt-tgt"><?= e(vv_t('translate.to_lang', $lang)) ?></label>
      <select class="select" id="tt-tgt"><option value="čeština" selected><?= e(vv_t('translate.lang_czech', $lang)) ?></option><option value="angličtina"><?= e(vv_t('translate.lang_english', $lang)) ?></option><option value="slovenština"><?= e(vv_t('translate.lang_slovak', $lang)) ?></option><option value="němčina"><?= e(vv_t('translate.lang_german', $lang)) ?></option><option value="francouzština"><?= e(vv_t('translate.lang_french', $lang)) ?></option><option value="španělština"><?= e(vv_t('translate.lang_spanish', $lang)) ?></option><option value="ruština"><?= e(vv_t('translate.lang_russian', $lang)) ?></option><option value="polština"><?= e(vv_t('translate.lang_polish', $lang)) ?></option><option value="italština"><?= e(vv_t('translate.lang_italian', $lang)) ?></option></select></div>
  </div>
  <textarea class="textarea" id="tt-input" rows="8" placeholder="<?= e(vv_t('translate.placeholder_input', $lang)) ?>"></textarea>
  <button class="btn btn-primary btn-touch" id="tt-run" type="button"><?= icon_svg('Languages', 18) ?> <span class="tt-label"><?= e(vv_t('translate.translate_btn', $lang)) ?></span><span class="tt-stop hidden"><?= e(vv_t('translate.stop', $lang)) ?></span></button>
  <div class="ai-error hidden" id="tt-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="tt-error-text"></span></div>
  <div class="result-card hidden" id="tt-out">
    <div class="markdown-body" id="tt-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem">
      <button class="btn btn-secondary btn-sm" id="tt-copy" type="button"><?= icon_svg('Copy', 14) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('translate.note', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
