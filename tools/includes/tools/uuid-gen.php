<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap">
    <div class="row" style="gap:0.5rem">
      <span class="muted" style="font-size:0.875rem"><?= e(vv_t('uuid_gen.count', $lang)) ?></span>
      <input class="input" style="width:5rem" type="number" id="uuid-count" min="1" max="100" value="5">
    </div>
    <button class="btn btn-primary" id="uuid-v4"><?= icon_svg('RefreshCw', 16) ?> <?= e(vv_t('tool_common.generate', $lang)) ?> UUID v4</button>
    <button class="btn btn-secondary" id="uuid-v7"><?= e(vv_t('tool_common.generate', $lang)) ?> UUID v7</button>
  </div>
  <div class="stack-sm" id="uuid-list">
    <p class="muted" style="font-size:0.875rem"><?= e(vv_t('uuid_gen.hint', $lang)) ?></p>
  </div>
</div>