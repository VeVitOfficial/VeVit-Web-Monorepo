<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pr-drop">
    <span class="dz-ico"><?= icon_svg('RotateCw', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_rotate.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('tool_common.click_choose', $lang)) ?></span>
  </div>
  <div class="hidden" id="pr-work">
    <div class="stack-sm">
      <label class="field-label" for="pr-angle"><?= e(vv_t('pdf_rotate.angle', $lang)) ?></label>
      <select class="select" id="pr-angle">
        <option value="90"><?= e(vv_t('pdf_rotate.angle_90', $lang)) ?></option>
        <option value="180">180°</option>
        <option value="270"><?= e(vv_t('pdf_rotate.angle_270', $lang)) ?></option>
      </select>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="pr-pages"><?= e(vv_t('pdf_rotate.pages', $lang)) ?></label>
      <input class="input" id="pr-pages" type="text" placeholder="<?= e(vv_t('pdf_rotate.pages_ph', $lang)) ?>">
    </div>
    <button class="btn btn-primary btn-touch" id="pr-run" type="button" disabled><?= icon_svg('RotateCw', 18) ?> <?= e(vv_t('pdf_rotate.run', $lang)) ?></button>
  </div>
  <div class="progress-track hidden" id="pr-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pr-prog-label"></p>
  <p class="error-text hidden" id="pr-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('pdf_rotate.footer', $lang)) ?></p>
</div>