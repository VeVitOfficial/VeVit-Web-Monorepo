<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem"><?= e(vv_t('tool_common.model', $lang)) ?>: llava (<?= e(vv_t('ai_vision.requires', $lang)) ?> <code>ollama pull llava</code>)</span></div>
  <div class="dropzone" id="vis-drop">
    <span class="dz-ico"><?= icon_svg('Eye', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('ai_vision.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('ai_vision.drop_hint', $lang)) ?></span>
  </div>
  <div class="file-list hidden" id="vis-list"></div>
  <div class="hidden" id="vis-work">
    <textarea class="textarea" id="vis-q" rows="3" placeholder="<?= e(vv_t('ai_vision.question_placeholder', $lang)) ?>"></textarea>
    <button class="btn btn-primary btn-touch" id="vis-run" type="button" disabled><?= icon_svg('Eye', 18) ?> <span class="vis-label"><?= e(vv_t('ai_vision.run', $lang)) ?></span><span class="vis-stop hidden"><?= e(vv_t('tool_common.stop', $lang)) ?></span></button>
  </div>
  <div class="ai-error hidden" id="vis-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="vis-error-text"></span></div>
  <div class="result-card hidden" id="vis-out">
    <div class="markdown-body" id="vis-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="vis-copy" type="button"><?= icon_svg('Copy', 14) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('ai_vision.footer', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>
