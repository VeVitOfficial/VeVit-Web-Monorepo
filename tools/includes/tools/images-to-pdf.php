<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="ip-drop">
    <span class="dz-ico"><?= icon_svg('Files', 28) ?></span>
    <span class="dz-title">Přetáhněte obrázky</span>
    <span class="dz-hint">PNG, JPG, WebP — každý obrázek = jedna strana</span>
  </div>
  <div class="hidden" id="ip-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="ip-orient">Orientace</label>
        <select class="select" id="ip-orient"><option value="auto" selected>Auto (podle obrázku)</option><option value="p">Na výšku</option><option value="l">Na šířku</option></select></div>
      <div class="stack-sm"><label class="field-label" for="ip-margin">Okraj (pt)</label><input class="input" id="ip-margin" type="number" value="0" min="0" max="72" style="width:6rem"></div>
      <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem;margin-bottom:0.35rem"><input type="checkbox" id="ip-fitA4" checked> Přizpůsobit A4</label>
    </div>
    <div class="file-list" id="ip-list"></div>
    <button class="btn btn-primary btn-touch" id="ip-run" type="button" disabled><?= icon_svg('Files', 18) ?> Vytvořit PDF</button>
  </div>
  <div class="progress-track hidden" id="ip-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="ip-prog-label"></p>
  <p class="error-text hidden" id="ip-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Spojení přes pdf-lib. Běží lokálně — obrázky neopustí prohlížeč.</p>
</div>