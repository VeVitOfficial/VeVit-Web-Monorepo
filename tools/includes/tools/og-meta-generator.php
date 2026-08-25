<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <div class="stack-sm"><label class="field-label" for="og-title"><?= e(vv_t('og_meta_generator.title', $lang)) ?></label><input class="input" id="og-title" type="text" placeholder="<?= e(vv_t('og_meta_generator.ph_title', $lang)) ?>"></div>
      <div class="stack-sm"><label class="field-label" for="og-desc"><?= e(vv_t('og_meta_generator.desc', $lang)) ?></label><textarea class="textarea" id="og-desc" rows="3" placeholder="<?= e(vv_t('og_meta_generator.ph_desc', $lang)) ?>"></textarea></div>
      <div class="stack-sm"><label class="field-label" for="og-url">URL (og:url)</label><input class="input mono" id="og-url" type="text" placeholder="https://example.com"></div>
      <div class="stack-sm"><label class="field-label" for="og-img"><?= e(vv_t('og_meta_generator.image', $lang)) ?></label><input class="input mono" id="og-img" type="text" placeholder="https://example.com/og.png"></div>
      <div class="stack-sm"><label class="field-label" for="og-site"><?= e(vv_t('og_meta_generator.site', $lang)) ?></label><input class="input" id="og-site" type="text"></div>
      <div class="stack-sm"><label class="field-label" for="og-type"><?= e(vv_t('og_meta_generator.type', $lang)) ?></label>
        <select class="select" id="og-type"><option>website</option><option>article</option><option>product</option><option>profile</option></select></div>
    </div>
    <div class="stack-sm">
      <span class="field-label"><?= e(vv_t('og_meta_generator.preview', $lang)) ?></span>
      <div class="glass" style="border-radius:0.75rem;overflow:hidden;padding:0">
        <div id="og-card-img" style="height:140px;background:#1f2937;display:flex;align-items:center;justify-content:center;color:#6b7280;background-size:cover;background-position:center"><?= e(vv_t('og_meta_generator.no_image', $lang)) ?></div>
        <div style="padding:0.75rem">
          <div id="og-card-site" class="muted" style="font-size:0.75rem">example.com</div>
          <div id="og-card-title" style="font-weight:600;margin:0.2rem 0"><?= e(vv_t('og_meta_generator.card_title', $lang)) ?></div>
          <div id="og-card-desc" class="muted" style="font-size:0.8rem"><?= e(vv_t('og_meta_generator.card_desc', $lang)) ?></div>
        </div>
      </div>
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="og-out"><?= e(vv_t('og_meta_generator.out', $lang)) ?></label>
    <textarea class="textarea mono" id="og-out" rows="11" readonly></textarea>
    <button class="btn btn-secondary" id="og-copy" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> <?= e(vv_t('tool_common.copy', $lang)) ?></button>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('og_meta_generator.footer', $lang)) ?></p>
</div>