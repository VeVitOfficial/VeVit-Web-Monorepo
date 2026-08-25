<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="bmr-sex"><?= e(vv_t('bmr_calc.sex', $lang)) ?></label>
      <select class="select" id="bmr-sex">
        <option value="m"><?= e(vv_t('bmr_calc.sex_male', $lang)) ?></option>
        <option value="f"><?= e(vv_t('bmr_calc.sex_female', $lang)) ?></option>
      </select>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="bmr-age"><?= e(vv_t('bmr_calc.age', $lang)) ?></label>
      <input class="input" type="number" id="bmr-age" min="1" max="120" step="1" value="30" inputmode="numeric">
    </div>
  </div>
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="bmr-height"><?= e(vv_t('bmr_calc.height', $lang)) ?></label>
      <input class="input" type="number" id="bmr-height" min="80" max="250" step="0.5" value="175" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="bmr-weight"><?= e(vv_t('bmr_calc.weight', $lang)) ?></label>
      <input class="input" type="number" id="bmr-weight" min="20" max="400" step="0.1" value="70" inputmode="decimal">
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="bmr-act"><?= e(vv_t('bmr_calc.activity', $lang)) ?></label>
    <select class="select" id="bmr-act">
      <option value="1.2"><?= e(vv_t('bmr_calc.act_sedentary', $lang)) ?></option>
      <option value="1.375" selected><?= e(vv_t('bmr_calc.act_light', $lang)) ?></option>
      <option value="1.55"><?= e(vv_t('bmr_calc.act_moderate', $lang)) ?></option>
      <option value="1.725"><?= e(vv_t('bmr_calc.act_hard', $lang)) ?></option>
      <option value="1.9"><?= e(vv_t('bmr_calc.act_very_hard', $lang)) ?></option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('bmr_calc.bmr_label', $lang)) ?></span><span class="v" id="bmr-bmr">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('bmr_calc.tdee_label', $lang)) ?></span><span class="v accent" id="bmr-tdee">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('bmr_calc.footer', $lang)) ?></p>
</div>