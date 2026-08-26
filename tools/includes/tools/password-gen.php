<div class="stack" id="pw-root" data-entropy-label="<?= e(vv_t('password_gen.entropy', $lang)) ?>" style="max-width:36rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local"><?= e(vv_t('tool_common.local', $lang)) ?></span>
  </div>

  <div class="row" style="gap:0.5rem">
    <input class="input input-mono" id="pw-out" readonly placeholder="<?= e(vv_t('password_gen.placeholder', $lang)) ?>" style="font-size:1.125rem;letter-spacing:0.05em;background:rgba(19,19,22,0.5)">
    <button class="btn btn-ghost btn-icon" id="pw-copy" disabled style="--ico:18">
      <span class="ico ico-copy"><?= icon_svg('Copy', 20) ?></span>
      <span class="ico ico-check hidden"><?= icon_svg('Check', 20) ?></span>
    </button>
  </div>

  <div class="stack-sm hidden" id="pw-strength-wrap">
    <div class="row-between" style="font-size:0.875rem">
      <span class="muted"><?= e(vv_t('password_gen.strength', $lang)) ?></span>
      <span id="pw-strength-label"></span>
    </div>
    <div class="strength-track">
      <div class="strength-fill" id="pw-strength-bar"></div>
    </div>
    <span class="editor-meta" id="pw-entropy"></span>
  </div>

  <div class="pw-options">
    <label class="stack-sm"><span class="field-label"><?= e(vv_t('password_gen.mode', $lang)) ?></span><select class="select" id="pw-mode"><option value="chars"><?= e(vv_t('password_gen.mode_chars', $lang)) ?></option><option value="words"><?= e(vv_t('password_gen.mode_words', $lang)) ?></option></select></label>
    <div class="row-between">
      <span style="font-size:0.875rem"><?= e(vv_t('password_gen.length', $lang)) ?> <span id="pw-len-label">16</span></span>
      <input type="range" min="4" max="64" value="16" id="pw-length">
    </div>
    <label class="pw-opt row-between">
      <span><?= e(vv_t('password_gen.lower', $lang)) ?></span>
      <input type="checkbox" id="pw-lower" checked>
    </label>
    <label class="pw-opt row-between">
      <span><?= e(vv_t('password_gen.upper', $lang)) ?></span>
      <input type="checkbox" id="pw-upper" checked>
    </label>
    <label class="pw-opt row-between">
      <span><?= e(vv_t('password_gen.digits', $lang)) ?></span>
      <input type="checkbox" id="pw-numbers" checked>
    </label>
    <label class="pw-opt row-between">
      <span><?= e(vv_t('password_gen.symbols', $lang)) ?></span>
      <input type="checkbox" id="pw-symbols" checked>
    </label>
    <label class="pw-opt row-between"><span><?= e(vv_t('password_gen.ambiguous', $lang)) ?></span><input type="checkbox" id="pw-ambiguous" checked></label>
  </div>

  <button class="btn btn-primary btn-block" id="pw-generate"><?= icon_svg('RefreshCw', 16) ?> <?= e(vv_t('tool_common.generate', $lang)) ?></button>
</div>
