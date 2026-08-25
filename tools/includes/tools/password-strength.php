<div class="stack" style="max-width:40rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="ps-pass"><?= e(vv_t('password_strength.password_label', $lang)) ?></label>
    <div class="row" style="gap:0.5rem">
      <input class="input" id="ps-pass" type="password" placeholder="<?= e(vv_t('password_strength.placeholder_password', $lang)) ?>" autocomplete="off" style="flex:1">
      <button class="btn btn-ghost" id="ps-toggle" type="button" aria-label="<?= e(vv_t('password_strength.toggle_aria', $lang)) ?>"><?= icon_svg('Eye', 16) ?></button>
    </div>
  </div>
  <div class="progress-track" id="ps-bar"><div class="progress-fill" id="ps-fill" style="width:0%"></div></div>
  <p class="muted" id="ps-label" style="font-size:0.85rem">—</p>
  <div class="glass" style="border-radius:0.75rem;padding:0.75rem 1rem" id="ps-detail">
    <div class="kv"><span class="k"><?= e(vv_t('password_strength.entropy', $lang)) ?></span><span class="v mono" id="ps-entropy">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('password_strength.length', $lang)) ?></span><span class="v mono" id="ps-len">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('password_strength.charsets', $lang)) ?></span><span class="v" id="ps-sets">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('password_strength.crack_time', $lang)) ?></span><span class="v mono" id="ps-crack">—</span></div>
  </div>
  <p class="muted" style="font-size:0.78rem"><?= e(vv_t('password_strength.note_pre', $lang)) ?><sup>10</sup><?= e(vv_t('password_strength.note_post', $lang)) ?></p>
</div>