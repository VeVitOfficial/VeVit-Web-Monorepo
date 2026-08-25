<div class="stack" style="max-width:56rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="seg" id="fj-lang" role="tablist" aria-label="<?= e(vv_t('css_js_html_formatter.lang_aria', $lang)) ?>">
      <button type="button" class="active" data-lang="css" role="tab" aria-selected="true">CSS</button>
      <button type="button" data-lang="html" role="tab" aria-selected="false">HTML</button>
      <button type="button" data-lang="js" role="tab" aria-selected="false">JS</button>
    </div>
    <div class="seg" id="fj-act" role="tablist" aria-label="<?= e(vv_t('css_js_html_formatter.act_aria', $lang)) ?>">
      <button type="button" class="active" data-act="beautify" role="tab" aria-selected="true"><?= e(vv_t('css_js_html_formatter.beautify', $lang)) ?></button>
      <button type="button" data-act="minify" role="tab" aria-selected="false"><?= e(vv_t('css_js_html_formatter.minify', $lang)) ?></button>
    </div>
    <div class="stack-sm" style="flex:0 0 auto">
      <label class="field-label" for="fj-indent"><?= e(vv_t('css_js_html_formatter.indent', $lang)) ?></label>
      <select class="select" id="fj-indent"><option value="2"><?= e(vv_t('css_js_html_formatter.indent_2', $lang)) ?></option><option value="4"><?= e(vv_t('css_js_html_formatter.indent_4', $lang)) ?></option></select>
    </div>
  </div>
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="fj-in"><?= e(vv_t('css_js_html_formatter.input', $lang)) ?></label>
      <textarea class="textarea mono" id="fj-in" rows="14" spellcheck="false" placeholder="<?= e(vv_t('css_js_html_formatter.input_ph', $lang)) ?>"></textarea>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="fj-out"><?= e(vv_t('css_js_html_formatter.output', $lang)) ?></label>
      <textarea class="textarea mono" id="fj-out" rows="14" readonly spellcheck="false"></textarea>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="fj-run" type="button"><?= icon_svg('SquareCode', 16) ?> <?= e(vv_t('css_js_html_formatter.run', $lang)) ?></button>
    <button class="btn btn-secondary" id="fj-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="fj-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('css_js_html_formatter.footer', $lang)) ?></p>
</div>