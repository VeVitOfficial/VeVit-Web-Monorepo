<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="dropzone" id="gm-drop">
    <span class="dz-ico"><?= icon_svg('Film', 28) ?></span>
    <span class="dz-title">Přetáhněte 2 a více obrázků</span>
    <span class="dz-hint">Pořadí = pořadí rámečků. PNG / JPG / WebP (client-side, gifenc)</span>
  </div>
  <div class="file-list hidden" id="gm-list"></div>
  <div class="hidden" id="gm-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="gm-delay">Zpoždění (ms/rameček)</label><input class="input" id="gm-delay" type="number" value="200" min="20" max="5000" step="20" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="gm-width">Šířka (px, 0 = dle prvního)</label><input class="input" id="gm-width" type="number" value="0" min="0" max="1280" step="2" style="width:6rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="gm-run" type="button" disabled><?= icon_svg('Film', 18) ?> Vytvořit GIF</button>
  </div>
  <div class="progress-track hidden" id="gm-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="gm-prog-label"></p>
  <p class="error-text hidden" id="gm-error" role="alert"></p>
  <div class="hidden" id="gm-out" style="margin-top:1rem">
    <p class="field-label">Výsledek</p>
    <div class="result-card" id="gm-card"></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Všechna rámečka se přeškálují na zvolenou (nebo první) velikost. Pořadí lze měnit šipkami. Běží lokálně přes gifenc, nic se neodesílá.</p>
</div>
<script src="/tools/assets/js/lib/gifenc.js"></script>