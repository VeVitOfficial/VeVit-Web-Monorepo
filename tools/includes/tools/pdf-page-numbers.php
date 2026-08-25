<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pn-drop">
    <span class="dz-ico"><?= icon_svg('Hash', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_page_numbers.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('tool_common.click_choose', $lang)) ?></span>
  </div>
  <div class="hidden" id="pn-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="pn-pos"><?= e(vv_t('pdf_page_numbers.pos', $lang)) ?></label>
        <select class="select" id="pn-pos">
          <option value="bl"><?= e(vv_t('pdf_page_numbers.pos_bl', $lang)) ?></option><option value="bc" selected><?= e(vv_t('pdf_page_numbers.pos_bc', $lang)) ?></option><option value="br"><?= e(vv_t('pdf_page_numbers.pos_br', $lang)) ?></option>
          <option value="tl"><?= e(vv_t('pdf_page_numbers.pos_tl', $lang)) ?></option><option value="tc"><?= e(vv_t('pdf_page_numbers.pos_tc', $lang)) ?></option><option value="tr"><?= e(vv_t('pdf_page_numbers.pos_tr', $lang)) ?></option>
        </select></div>
      <div class="stack-sm"><label class="field-label" for="pn-start"><?= e(vv_t('pdf_page_numbers.start', $lang)) ?></label><input class="input" id="pn-start" type="number" value="1" min="0" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="pn-fmt"><?= e(vv_t('pdf_page_numbers.format', $lang)) ?></label>
        <select class="select" id="pn-fmt"><option value="{n}">{n}</option><option value="{n}/{t}" selected>{n}/{t}</option><option value="<?= e(vv_t('pdf_page_numbers.fmt_page_of', $lang)) ?>"><?= e(vv_t('pdf_page_numbers.fmt_page_of', $lang)) ?></option></select></div>
      <div class="stack-sm"><label class="field-label" for="pn-size"><?= e(vv_t('pdf_page_numbers.size', $lang)) ?></label><input class="input" id="pn-size" type="number" value="10" min="6" max="24" style="width:6rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="pn-run" type="button" disabled><?= icon_svg('Hash', 18) ?> <?= e(vv_t('pdf_page_numbers.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="pn-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pn-prog-label"></p>
  <p class="error-text hidden" id="pn-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('pdf_page_numbers.footer', $lang)) ?></p>
</div>