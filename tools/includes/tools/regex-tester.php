<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local"><?= e(vv_t('tool_common.local', $lang)) ?></span>
  </div>

  <div class="row" style="gap:0.75rem;align-items:flex-end">
    <div class="stack-sm" style="flex:1">
      <label class="field-label" for="rx-pattern"><?= e(vv_t('regex_tester.pattern', $lang)) ?></label>
      <input class="input input-mono" id="rx-pattern" placeholder="<?= e(vv_t('regex_tester.ph_pattern', $lang)) ?>">
    </div>
    <div class="stack-sm" style="width:6rem">
      <label class="field-label" for="rx-flags">Flags</label>
      <input class="input input-mono" id="rx-flags" placeholder="gi" value="g">
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="rx-text"><?= e(vv_t('regex_tester.test_text', $lang)) ?></label>
    <textarea class="textarea input-mono" id="rx-text" placeholder="<?= e(vv_t('regex_tester.ph_text', $lang)) ?>" style="min-height:120px;background:rgba(19,19,22,0.5)"></textarea>
  </div>

  <p class="error-text hidden" id="rx-error"></p>

  <div class="stack-sm hidden" id="rx-out-wrap">
    <div class="regex-out input-mono" id="rx-highlight"></div>
    <div style="font-size:0.875rem">
      <span style="font-weight:500"><?= e(vv_t('regex_tester.matches', $lang)) ?></span><span id="rx-count">0</span>
    </div>
  </div>
</div>