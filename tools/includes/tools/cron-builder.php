<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="stack-sm">
    <span class="field-label"><?= e(vv_t('cron_builder.presets', $lang)) ?></span>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem" id="cb-presets">
      <button class="btn btn-ghost" data-cron="* * * * *" type="button"><?= e(vv_t('cron_builder.p_every_min', $lang)) ?></button>
      <button class="btn btn-ghost" data-cron="0 * * * *" type="button"><?= e(vv_t('cron_builder.p_every_hour', $lang)) ?></button>
      <button class="btn btn-ghost" data-cron="0 0 * * *" type="button"><?= e(vv_t('cron_builder.p_daily_midnight', $lang)) ?></button>
      <button class="btn btn-ghost" data-cron="0 0 * * 0" type="button"><?= e(vv_t('cron_builder.p_sunday_midnight', $lang)) ?></button>
      <button class="btn btn-ghost" data-cron="0 0 1 * *" type="button"><?= e(vv_t('cron_builder.p_monthly_1st', $lang)) ?></button>
      <button class="btn btn-ghost" data-cron="0 17 * * 5" type="button"><?= e(vv_t('cron_builder.p_friday_1700', $lang)) ?></button>
    </div>
  </div>
  <div class="two-col" style="gap:0.75rem">
    <div class="stack-sm">
      <label class="field-label" for="cb-min"><?= e(vv_t('cron_builder.f_min', $lang)) ?></label>
      <input class="input mono" id="cb-min" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-hour"><?= e(vv_t('cron_builder.f_hour', $lang)) ?></label>
      <input class="input mono" id="cb-hour" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-dom"><?= e(vv_t('cron_builder.f_dom', $lang)) ?></label>
      <input class="input mono" id="cb-dom" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-mon"><?= e(vv_t('cron_builder.f_mon', $lang)) ?></label>
      <input class="input mono" id="cb-mon" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-dow"><?= e(vv_t('cron_builder.f_dow', $lang)) ?></label>
      <input class="input mono" id="cb-dow" type="text" value="*" autocomplete="off">
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="cb-expr"><?= e(vv_t('cron_builder.expr', $lang)) ?></label>
    <input class="input mono" id="cb-expr" type="text" value="* * * * *" autocomplete="off">
    <button class="btn btn-secondary" id="cb-copy" type="button" style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> <?= e(vv_t('cron_builder.copy_expr', $lang)) ?></button>
  </div>
  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem">
    <div class="kv"><span class="k"><?= e(vv_t('cron_builder.meaning', $lang)) ?></span><span class="v" id="cb-desc">—</span></div>
  </div>
  <p class="error-text hidden" id="cb-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('cron_builder.footer', $lang)) ?></p>
</div>