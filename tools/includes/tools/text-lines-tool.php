<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="lt-in"><?= e(vv_t('text_lines_tool.input', $lang)) ?></label>
    <textarea class="textarea mono" id="lt-in" rows="8" placeholder="<?= e(vv_t('text_lines_tool.ph', $lang)) ?>"></textarea>
  </div>
  <div class="row" id="lt-btns" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-ghost" type="button" data-op="sort"><?= e(vv_t('text_lines_tool.op_sort', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="sortdesc"><?= e(vv_t('text_lines_tool.op_sortdesc', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="unique"><?= e(vv_t('text_lines_tool.op_unique', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="trim"><?= e(vv_t('text_lines_tool.op_trim', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="nonempty"><?= e(vv_t('text_lines_tool.op_nonempty', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="reverse"><?= e(vv_t('text_lines_tool.op_reverse', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="shuffle"><?= e(vv_t('text_lines_tool.op_shuffle', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="number"><?= e(vv_t('text_lines_tool.op_number', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-op="dedup-blank"><?= e(vv_t('text_lines_tool.op_dedup_blank', $lang)) ?></button>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="lt-out"><?= e(vv_t('text_lines_tool.output', $lang)) ?></label>
    <textarea class="textarea mono" id="lt-out" rows="8" readonly></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-secondary" id="lt-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
      <button class="btn btn-ghost" id="lt-back" type="button"><?= e(vv_t('text_lines_tool.back', $lang)) ?></button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('text_lines_tool.footer', $lang)) ?></p>
</div>