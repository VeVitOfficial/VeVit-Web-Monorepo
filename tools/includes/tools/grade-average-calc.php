<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="stack-sm" id="ga-rows"></div>
  <button class="btn btn-secondary btn-touch" id="ga-add" type="button"><?= icon_svg('Plus', 16) ?> <?= e(vv_t('grade_average_calc.add_grade', $lang)) ?></button>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('grade_average_calc.weighted_avg', $lang)) ?></span><span class="v accent" id="ga-avg">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('grade_average_calc.count', $lang)) ?></span><span class="v" id="ga-count">0</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('grade_average_calc.footer', $lang)) ?></p>
</div>