<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="li-count"><?= e(vv_t('lorem_ipsum.count', $lang)) ?></label><input class="input" id="li-count" type="number" value="3" min="1" max="100"></div>
    <div class="stack-sm"><label class="field-label" for="li-unit"><?= e(vv_t('lorem_ipsum.unit', $lang)) ?></label>
      <select class="select" id="li-unit"><option value="paragraphs"><?= e(vv_t('lorem_ipsum.unit_paragraphs', $lang)) ?></option><option value="sentences"><?= e(vv_t('lorem_ipsum.unit_sentences', $lang)) ?></option><option value="words"><?= e(vv_t('lorem_ipsum.unit_words', $lang)) ?></option></select></div>
    <button class="btn btn-primary" id="li-gen" type="button"><?= icon_svg('Pilcrow', 16) ?> <?= e(vv_t('tool_common.generate', $lang)) ?></button>
    <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.85rem"><input type="checkbox" id="li-classic" checked> <?= e(vv_t('lorem_ipsum.start_classic', $lang)) ?></label>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="li-out"><?= e(vv_t('lorem_ipsum.text', $lang)) ?></label>
    <textarea class="textarea" id="li-out" rows="10" readonly></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-secondary" id="li-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('lorem_ipsum.footer', $lang)) ?></p>
</div>