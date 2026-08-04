<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="dropzone" id="ps-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title">Přetáhněte sem PDF soubor</span>
    <span class="dz-hint">nebo klikněte pro výběr</span>
    <span class="dz-accept">Pouze .pdf · jeden soubor</span>
  </div>

  <div class="file-list hidden" id="ps-list" aria-label="Vybraný soubor"></div>

  <div class="stack-sm">
    <span class="field-label">Režim rozdělení</span>
    <div class="seg" id="ps-mode" role="tablist">
      <button type="button" class="active" data-mode="each" role="tab" aria-selected="true">Každá stránka zvlášť</button>
      <button type="button" data-mode="chunk" role="tab" aria-selected="false">Po N stranách</button>
      <button type="button" data-mode="ranges" role="tab" aria-selected="false">Vlastní rozsahy</button>
    </div>
  </div>

  <div class="stack-sm hidden" id="ps-chunk-opt">
    <label class="field-label" for="ps-n">Počet stránek v jednom souboru</label>
    <input class="input" type="number" id="ps-n" min="1" value="1" style="width:8rem" inputmode="numeric">
  </div>
  <div class="stack-sm hidden" id="ps-ranges-opt">
    <label class="field-label" for="ps-ranges">Rozsahy stránek (např. 1-3, 4, 5-8)</label>
    <input class="input" type="text" id="ps-ranges" placeholder="1-3, 4, 5-8" style="width:100%">
  </div>

  <div class="row" style="flex-wrap:wrap">
    <button class="btn btn-primary btn-touch" id="ps-run" type="button" disabled><?= icon_svg('Scissors', 18) ?> Rozdělit a zabalit (ZIP)</button>
    <button class="btn btn-ghost" id="ps-clear" type="button" disabled><?= icon_svg('Trash', 16) ?> Vyčistit</button>
  </div>

  <div class="progress-track hidden" id="ps-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="ps-prog-label"></p>
  <p class="error-text hidden" id="ps-error" role="alert"></p>

  <div class="result-card hidden" id="ps-result">
    <span class="rc-ico"><?= icon_svg('FileText', 24) ?></span>
    <div class="rc-meta">
      <span class="rc-title">pdf-split.zip</span>
      <span class="rc-sub" id="ps-result-sub"></span>
    </div>
    <button class="btn btn-primary" id="ps-download" type="button"><?= icon_svg('Download', 16) ?> Stáhnout ZIP</button>
  </div>

  <div class="privacy-note"><?= icon_svg('ShieldCheck', 16) ?> PDF se rozděluje lokálně přes pdf-lib a JSZip. Soubor se neodesílá na server.</div>
</div>