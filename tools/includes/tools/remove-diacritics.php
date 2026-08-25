<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="rd-in"><?= e(vv_t('remove_diacritics.input', $lang)) ?></label>
    <textarea class="textarea" id="rd-in" rows="5" placeholder="<?= e(vv_t('remove_diacritics.ph', $lang)) ?>"></textarea>
  </div>
  <button class="btn btn-primary" id="rd-run" type="button"><?= icon_svg('SpellCheck', 16) ?> <?= e(vv_t('remove_diacritics.run', $lang)) ?></button>
  <div class="stack-sm">
    <label class="field-label" for="rd-out"><?= e(vv_t('remove_diacritics.output', $lang)) ?></label>
    <textarea class="textarea" id="rd-out" rows="5" readonly></textarea>
    <button class="btn btn-secondary" id="rd-copy" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('remove_diacritics.footer', $lang)) ?></p>
</div>