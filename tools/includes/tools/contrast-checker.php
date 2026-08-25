<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <label class="field-label" for="cc-fg"><?= e(vv_t('contrast_checker.fg', $lang)) ?></label>
      <input class="input mono" id="cc-fg" type="text" value="#000000" autocomplete="off">
      <input type="color" id="cc-fg-pick" value="#000000" style="margin-top:0.5rem;width:100%;height:2.5rem;border:none;background:none;cursor:pointer">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cc-bg"><?= e(vv_t('contrast_checker.bg', $lang)) ?></label>
      <input class="input mono" id="cc-bg" type="text" value="#ffffff" autocomplete="off">
      <input type="color" id="cc-bg-pick" value="#ffffff" style="margin-top:0.5rem;width:100%;height:2.5rem;border:none;background:none;cursor:pointer">
    </div>
  </div>
  <div class="glass" id="cc-preview" style="border-radius:0.75rem;padding:1.5rem;text-align:center;background:#fff;color:#000">
    <div style="font-size:1.5rem;font-weight:700"><?= e(vv_t('contrast_checker.preview_title', $lang)) ?></div>
    <div style="font-size:1rem;margin-top:0.5rem"><?= e(vv_t('contrast_checker.preview_body', $lang)) ?></div>
  </div>
  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem">
    <div class="kv"><span class="k"><?= e(vv_t('contrast_checker.contrast', $lang)) ?></span><span class="v mono" id="cc-ratio">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('contrast_checker.aa_normal', $lang)) ?></span><span class="v" id="cc-aa">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('contrast_checker.aa_large', $lang)) ?></span><span class="v" id="cc-aa-large">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('contrast_checker.aaa_normal', $lang)) ?></span><span class="v" id="cc-aaa">—</span></div>
    <div class="kv"><span class="k"><?= e(vv_t('contrast_checker.aaa_large', $lang)) ?></span><span class="v" id="cc-aaa-large">—</span></div>
  </div>
  <p class="error-text hidden" id="cc-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('contrast_checker.footer', $lang)) ?></p>
</div>