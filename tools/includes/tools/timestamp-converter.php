<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="tc-mode" role="tablist" aria-label="<?= e(vv_t('timestamp_converter.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="t2d" role="tab" aria-selected="true"><?= e(vv_t('timestamp_converter.mode_t2d', $lang)) ?></button>
    <button type="button" data-mode="d2t" role="tab" aria-selected="false"><?= e(vv_t('timestamp_converter.mode_d2t', $lang)) ?></button>
  </div>

  <div id="tc-t2d" class="tc-group" data-for="t2d">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm" style="flex:1;min-width:12rem">
        <label class="field-label" for="tc-ts"><?= e(vv_t('timestamp_converter.ts_label', $lang)) ?></label>
        <input class="input mono" id="tc-ts" type="text" placeholder="1700000000" autocomplete="off">
      </div>
      <div class="stack-sm">
        <label class="field-label" for="tc-unit"><?= e(vv_t('timestamp_converter.unit', $lang)) ?></label>
        <select class="select" id="tc-unit">
          <option value="s"><?= e(vv_t('timestamp_converter.unit_s', $lang)) ?></option>
          <option value="ms"><?= e(vv_t('timestamp_converter.unit_ms', $lang)) ?></option>
        </select>
      </div>
    </div>
  </div>

  <div id="tc-d2t" class="tc-group hidden" data-for="d2t">
    <div class="stack-sm">
      <label class="field-label" for="tc-date"><?= e(vv_t('timestamp_converter.date_label', $lang)) ?></label>
      <input class="input mono" id="tc-date" type="datetime-local" step="1">
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="tc-tz"><?= e(vv_t('timestamp_converter.tz', $lang)) ?></label>
    <select class="select" id="tc-tz">
      <option value="local"><?= e(vv_t('timestamp_converter.tz_local', $lang)) ?></option>
      <option value="UTC">UTC</option>
      <option value="Europe/Prague">Europe/Prague</option>
      <option value="Europe/London">Europe/London</option>
      <option value="America/New_York">America/New_York</option>
      <option value="Asia/Tokyo">Asia/Tokyo</option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem">
    <div class="kv"><span class="k"><?= e(vv_t('tool_common.result', $lang)) ?></span><span class="v mono" id="tc-out">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('timestamp_converter.relative', $lang)) ?></span><span class="v" id="tc-rel">—</span></div>
  </div>
  <p class="error-text hidden" id="tc-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('timestamp_converter.footer', $lang)) ?></p>
</div>