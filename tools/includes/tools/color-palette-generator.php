<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="cp-base"><?= e(vv_t('color_palette_generator.base', $lang)) ?></label><input class="input mono" id="cp-base" type="text" value="#3b82f6"></div>
    <div class="stack-sm"><label class="field-label" for="cp-pick"><?= e(vv_t('color_palette_generator.pick', $lang)) ?></label><input type="color" id="cp-pick" value="#3b82f6" style="width:4rem;height:2.5rem;border:none;background:none;cursor:pointer"></div>
    <div class="stack-sm"><label class="field-label" for="cp-scheme"><?= e(vv_t('color_palette_generator.scheme', $lang)) ?></label>
      <select class="select" id="cp-scheme">
        <option value="complementary"><?= e(vv_t('color_palette_generator.sch_complementary', $lang)) ?></option>
        <option value="analogous"><?= e(vv_t('color_palette_generator.sch_analogous', $lang)) ?></option>
        <option value="triadic"><?= e(vv_t('color_palette_generator.sch_triadic', $lang)) ?></option>
        <option value="tetradic"><?= e(vv_t('color_palette_generator.sch_tetradic', $lang)) ?></option>
        <option value="monochromatic"><?= e(vv_t('color_palette_generator.sch_monochromatic', $lang)) ?></option>
        <option value="shades"><?= e(vv_t('color_palette_generator.sch_shades', $lang)) ?></option>
      </select></div>
  </div>
  <div id="cp-out" class="row" style="flex-wrap:wrap;gap:0.75rem"></div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('color_palette_generator.footer', $lang)) ?></p>
</div>