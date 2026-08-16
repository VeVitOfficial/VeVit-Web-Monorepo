<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pi-drop">
    <span class="dz-ico"><?= icon_svg('ImagePlus', 28) ?></span>
    <span class="dz-title">Přetáhněte PDF soubor</span>
    <span class="dz-hint">Stránky se vyrenderují jako obrázky a zabalí do ZIP</span>
  </div>
  <div class="hidden" id="pi-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="pi-scale">Měřítko (DPI ekv.)</label>
        <select class="select" id="pi-scale"><option value="1">72 DPI</option><option value="1.5" selected>108 DPI</option><option value="2">144 DPI</option><option value="3">216 DPI</option></select></div>
      <div class="stack-sm"><label class="field-label" for="pi-format">Formát</label>
        <select class="select" id="pi-format"><option value="image/png" selected>PNG</option><option value="image/jpeg">JPEG</option></select></div>
      <div class="stack-sm hidden" id="pi-q-grp"><label class="field-label" for="pi-q">Kvalita JPEG</label><input type="range" id="pi-q" min="0.5" max="0.95" step="0.01" value="0.82" style="width:10rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="pi-run" type="button" disabled><?= icon_svg('ImagePlus', 18) ?> Převést na obrázky (ZIP)</button>
  </div>
  <div class="progress-track hidden" id="pi-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pi-prog-label"></p>
  <p class="error-text hidden" id="pi-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Render přes pdf.js, balení přes JSZip. Běží lokálně.</p>
</div>