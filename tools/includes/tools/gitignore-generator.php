<div class="stack" style="max-width:50rem;margin:0 auto">
  <span class="field-label"><?= e(vv_t('gitignore_generator.select_langs', $lang)) ?></span>
  <div id="gi-checks" class="row" style="flex-wrap:wrap;gap:0.5rem"></div>
  <div class="stack-sm">
    <label class="field-label" for="gi-out">.gitignore</label>
    <textarea class="textarea mono" id="gi-out" rows="16" readonly></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-secondary" id="gi-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
      <button class="btn btn-ghost" id="gi-clear" type="button"><?= e(vv_t('gitignore_generator.clear_selection', $lang)) ?></button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('gitignore_generator.note', $lang)) ?></p>
</div>