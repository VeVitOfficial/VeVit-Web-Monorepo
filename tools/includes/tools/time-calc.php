<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="tc-mode" role="tablist" aria-label="<?= e(vv_t('time_calc.mode_aria', $lang)) ?>">
    <button type="button" class="active" data-mode="dur" role="tab" aria-selected="true"><?= e(vv_t('time_calc.mode_dur', $lang)) ?></button>
    <button type="button" data-mode="clock" role="tab" aria-selected="false"><?= e(vv_t('time_calc.mode_clock', $lang)) ?></button>
  </div>

  <div class="stack-sm" id="tc-dur">
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;align-items:end">
      <span class="muted" style="font-size:0.875rem"><?= e(vv_t('time_calc.dur1', $lang)) ?></span>
      <input class="input mono" type="text" id="tc-a" style="width:8rem" placeholder="HH:MM:SS" value="01:30:00">
      <select class="select" id="tc-op" style="width:auto">
        <option value="+">+</option>
        <option value="-">−</option>
      </select>
      <span class="muted" style="font-size:0.875rem"><?= e(vv_t('time_calc.dur2', $lang)) ?></span>
      <input class="input mono" type="text" id="tc-b" style="width:8rem" placeholder="HH:MM:SS" value="00:45:30">
    </div>
  </div>

  <div class="stack-sm hidden" id="tc-clock">
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;align-items:end">
      <span class="muted" style="font-size:0.875rem"><?= e(vv_t('time_calc.clock_time', $lang)) ?></span>
      <input class="input mono" type="text" id="tc-c" style="width:8rem" placeholder="HH:MM:SS" value="10:00:00">
      <span class="muted" style="font-size:0.875rem"><?= e(vv_t('time_calc.clock_dur', $lang)) ?></span>
      <input class="input mono" type="text" id="tc-d" style="width:8rem" placeholder="HH:MM:SS" value="02:15:00">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k"><?= e(vv_t('tool_common.result', $lang)) ?></span><span class="v accent mono" id="tc-result">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('time_calc.footer', $lang)) ?></p>
</div>