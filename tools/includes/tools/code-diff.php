<div class="stack" style="max-width:64rem;margin:0 auto">
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="cd-left"><?= e(vv_t('code_diff.original', $lang)) ?></label>
      <textarea class="textarea mono" id="cd-left" rows="14" spellcheck="false" placeholder="<?= e(vv_t('code_diff.original_ph', $lang)) ?>"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cd-right"><?= e(vv_t('code_diff.modified', $lang)) ?></label>
      <textarea class="textarea mono" id="cd-right" rows="14" spellcheck="false" placeholder="<?= e(vv_t('code_diff.modified_ph', $lang)) ?>"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="cd-run" type="button"><?= icon_svg('GitCompare', 16) ?> <?= e(vv_t('code_diff.compare', $lang)) ?></button>
    <span class="muted" id="cd-stat" style="align-self:center;font-size:0.85rem"></span>
  </div>
  <div id="cd-out" class="glass" style="border-radius:0.75rem;overflow:auto;max-height:30rem"></div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('code_diff.note', $lang)) ?></p>
</div>