<div class="stack" style="max-width:64rem;margin:0 auto">
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('mind_map.hint', $lang)) ?></p>
  <div class="two-col" style="gap:1rem;align-items:start">
    <div class="stack-sm">
      <label class="field-label" for="mm-in"><?= e(vv_t('mind_map.structure', $lang)) ?></label>
      <textarea class="textarea mono" id="mm-in" rows="16" spellcheck="false">Projekt
  Analýza
    Požadavky
    Konkurence
  Vývoj
    Backend
    Frontend
    Testování
  Deployment
    Staging
    Produkce</textarea>
    </div>
    <div class="stack-sm">
      <span class="field-label"><?= e(vv_t('mind_map.preview', $lang)) ?></span>
      <div id="mm-svg-wrap" style="border-radius:0.75rem;overflow:auto;max-height:32rem"></div>
    </div>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-secondary" id="mm-svg-dl" type="button"><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?> SVG</button>
    <button class="btn btn-ghost" id="mm-sample" type="button"><?= e(vv_t('mind_map.sample', $lang)) ?></button>
  </div>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('mind_map.footer', $lang)) ?></p>
</div>