<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="bg-drop">
    <span class="dz-ico"><?= icon_svg('Eraser', 28) ?></span>
    <span class="dz-title">Přetáhněte fotografii (ideálně portrét)</span>
    <span class="dz-hint">AI odstranění pozadí (ONNX MODNet, běží lokálně)</span>
  </div>
  <div class="file-list hidden" id="bg-list"></div>
  <div class="hidden" id="bg-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="bg-bg">Pozadí výstupu</label>
        <select class="select" id="bg-bg"><option value="transparent" selected>Průhledné (PNG)</option><option value="white">Bílé</option><option value="black">Černé</option><option value="green">Zelené (chroma)</option></select></div>
    </div>
    <button class="btn btn-primary btn-touch" id="bg-run" type="button" disabled><?= icon_svg('Eraser', 18) ?> Odstranit pozadí</button>
  </div>
  <div class="progress-track hidden" id="bg-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="bg-prog-label"></p>
  <p class="error-text hidden" id="bg-error" role="alert"></p>
  <div class="hidden" id="bg-out" style="margin-top:1rem">
    <p class="field-label">Výsledek</p>
    <div class="result-card" id="bg-card"></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Model MODNet je optimalizován na <strong>portréty osob</strong> — u jiných motivů (zvířata, předměty, krajiny) může být výsledek nepřesný. Model (~26 MB) se načte jen při otevření nástroje. Vše běží v prohlížeči, obrázek se nikam neodesílá.</p>
</div>