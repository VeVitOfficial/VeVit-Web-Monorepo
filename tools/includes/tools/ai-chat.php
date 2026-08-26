<div class="ai-chat" data-copy-label="<?= e(vv_t('ai_chat.copy_response', $lang)) ?>" data-retry-label="<?= e(vv_t('ai_chat.retry', $lang)) ?>">
  <div class="ai-head">
    <span class="badge badge-ai">AI</span>
    <span class="muted" style="font-size:0.875rem"><?= e(vv_t('tool_common.model', $lang)) ?>: llama3.2</span>
    <span class="ai-connection" id="ai-connection"><span></span><?= e(vv_t('tool_ui.state_ready', $lang)) ?></span>
    <button class="btn btn-ghost btn-sm" id="ai-new" type="button" style="margin-left:auto"><?= e(vv_t('ai_chat.new_chat', $lang)) ?></button>
  </div>

  <div class="ai-messages" id="ai-messages">
    <div class="ai-empty" id="ai-empty">
      <div class="ai-empty-icon"><?= icon_svg('Bot', 40) ?></div>
      <p class="ai-empty-title"><?= e(vv_t('ai_chat.assistant_title', $lang)) ?></p>
      <p class="muted" style="font-size:0.875rem"><?= e(vv_t('ai_chat.empty_hint', $lang)) ?></p>
      <div class="ai-starters">
        <?php foreach (['starter_explain', 'starter_plan', 'starter_improve'] as $starter): ?><button class="ai-starter" type="button"><?= e(vv_t('ai_chat.' . $starter, $lang)) ?></button><?php endforeach; ?>
      </div>
    </div>
  </div>

  <div class="ai-error hidden" id="ai-error">
    <span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span>
    <span id="ai-error-text"></span>
  </div>

  <div class="ai-input">
    <textarea class="textarea" id="ai-input" placeholder="<?= e(vv_t('ai_chat.placeholder', $lang)) ?>"></textarea>
    <button class="btn btn-primary btn-lg" id="ai-send" style="flex-shrink:0">
      <span class="ico ico-send"><?= icon_svg('Send', 18) ?></span>
      <span class="ico ico-stop hidden"><?= e(vv_t('tool_common.stop', $lang)) ?></span>
    </button>
  </div>
  <p class="ai-disclaimer"><?= e(vv_t('ai_chat.disclaimer', $lang)) ?></p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
