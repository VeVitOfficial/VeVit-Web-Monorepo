<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="dropzone" id="pm-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title">Přetáhněte sem PDF soubory</span>
    <span class="dz-hint">nebo klikněte pro výběr</span>
    <span class="dz-accept">Pouze .pdf · více souborů · pořadí lze měnit</span>
  </div>

  <div class="file-list hidden" id="pm-list" aria-label="Vybrané soubory"></div>

  <div class="row" style="flex-wrap:wrap">
    <button class="btn btn-primary btn-touch" id="pm-run" type="button" disabled><?= icon_svg('Files', 18) ?> Sloučit PDF</button>
    <button class="btn btn-ghost" id="pm-clear" type="button" disabled><?= icon_svg('Trash', 16) ?> Vyčistit</button>
  </div>

  <div class="progress-track hidden" id="pm-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pm-prog-label"></p>
  <p class="error-text hidden" id="pm-error" role="alert"></p>

  <div class="result-card hidden" id="pm-result">
    <span class="rc-ico"><?= icon_svg('FileText', 24) ?></span>
    <div class="rc-meta">
      <span class="rc-title" id="pm-result-name">sloučeno.pdf</span>
      <span class="rc-sub" id="pm-result-sub"></span>
    </div>
    <button class="btn btn-primary" id="pm-download" type="button"><?= icon_svg('Download', 16) ?> Stáhnout</button>
  </div>

  <div class="privacy-note"><?= icon_svg('ShieldCheck', 16) ?> PDF se slévají lokálně v prohlížeči přes pdf-lib. Soubory se nikdy neodesílají na server.</div>
</div>