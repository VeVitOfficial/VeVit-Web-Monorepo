<script src="/tools/assets/js/lib/html-pdf-sanitize.js"></script>
<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="hp-html"><?= e(vv_t('html_to_pdf.html_label', $lang)) ?></label>
    <textarea class="textarea" id="hp-html" rows="10" placeholder="<h1><?= e(vv_t('html_to_pdf.ph_heading', $lang)) ?></h1>&#10;<p><?= e(vv_t('html_to_pdf.ph_body', $lang)) ?></p>"><h1><?= e(vv_t('html_to_pdf.sample_hello', $lang)) ?></h1>
<p><?= e(vv_t('html_to_pdf.sample_body_pre', $lang)) ?><strong>HTML</strong><?= e(vv_t('html_to_pdf.sample_body_post', $lang)) ?></p>
<ul><li><?= e(vv_t('html_to_pdf.sample_item', $lang)) ?> 1</li><li><?= e(vv_t('html_to_pdf.sample_item', $lang)) ?> 2</li></ul></textarea>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="hp-size"><?= e(vv_t('html_to_pdf.format', $lang)) ?></label>
      <select class="select" id="hp-size"><option value="a4" selected>A4</option><option value="letter">Letter</option></select></div>
    <div class="stack-sm"><label class="field-label" for="hp-orient"><?= e(vv_t('html_to_pdf.orient', $lang)) ?></label>
      <select class="select" id="hp-orient"><option value="p" selected><?= e(vv_t('html_to_pdf.orient_portrait', $lang)) ?></option><option value="l"><?= e(vv_t('html_to_pdf.orient_landscape', $lang)) ?></option></select></div>
    <div class="stack-sm"><label class="field-label" for="hp-scale"><?= e(vv_t('html_to_pdf.scale', $lang)) ?></label>
      <select class="select" id="hp-scale"><option value="1">1×</option><option value="2" selected>2×</option><option value="3">3×</option></select></div>
    <button class="btn btn-primary btn-touch" id="hp-run" type="button"><?= icon_svg('FileCode', 18) ?> <?= e(vv_t('html_to_pdf.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="hp-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="hp-prog-label"></p>
  <p class="error-text hidden" id="hp-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('html_to_pdf.footer', $lang)) ?></p>
</div>