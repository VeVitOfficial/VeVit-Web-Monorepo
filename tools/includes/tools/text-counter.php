<div class="stack" id="tc-root" data-minute-unit="<?= e(vv_t('text_counter.min_unit', $lang)) ?>" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="tc-in"><?= e(vv_t('text_counter.text', $lang)) ?></label>
    <textarea class="textarea" id="tc-in" rows="10" placeholder="<?= e(vv_t('text_counter.placeholder', $lang)) ?>"></textarea>
  </div>
  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem">
    <div class="kv"><span class="k"><?= e(vv_t('text_counter.chars_spaces', $lang)) ?></span><span class="v mono" id="tc-chars">0</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('text_counter.chars_no_spaces', $lang)) ?></span><span class="v mono" id="tc-nospace">0</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('text_counter.words', $lang)) ?></span><span class="v mono" id="tc-words">0</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('text_counter.sentences', $lang)) ?></span><span class="v mono" id="tc-sent">0</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('text_counter.paragraphs', $lang)) ?></span><span class="v mono" id="tc-par">0</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('text_counter.read_time', $lang)) ?></span><span class="v" id="tc-read">0 <?= e(vv_t('text_counter.min_unit', $lang)) ?></span></div>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('text_counter.note', $lang)) ?></p>
</div>
