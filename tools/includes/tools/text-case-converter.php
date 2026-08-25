<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="tcc-in"><?= e(vv_t('text_case_converter.input', $lang)) ?></label>
    <textarea class="textarea mono" id="tcc-in" rows="5" placeholder="<?= e(vv_t('text_case_converter.placeholder_input', $lang)) ?>"></textarea>
  </div>
  <div class="row" id="tcc-btns" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-ghost" type="button" data-fn="upper"><?= e(vv_t('text_case_converter.upper', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-fn="lower"><?= e(vv_t('text_case_converter.lower', $lang)) ?></button>
    <button class="btn btn-ghost" type="button" data-fn="title">Title Case</button>
    <button class="btn btn-ghost" type="button" data-fn="sentence">Sentence case</button>
    <button class="btn btn-ghost" type="button" data-fn="camel">camelCase</button>
    <button class="btn btn-ghost" type="button" data-fn="pascal">PascalCase</button>
    <button class="btn btn-ghost" type="button" data-fn="snake">snake_case</button>
    <button class="btn btn-ghost" type="button" data-fn="kebab">kebab-case</button>
    <button class="btn btn-ghost" type="button" data-fn="const">CONSTANT_CASE</button>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="tcc-out"><?= e(vv_t('text_case_converter.output', $lang)) ?></label>
    <textarea class="textarea mono" id="tcc-out" rows="5" readonly></textarea>
    <button class="btn btn-secondary" id="tcc-copy" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('text_case_converter.note', $lang)) ?></p>
</div>