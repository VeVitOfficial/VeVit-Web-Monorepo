<script src="/tools/assets/js/lib/html-pdf-sanitize.js"></script>
<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="hp-html">HTML kód</label>
    <textarea class="textarea" id="hp-html" rows="10" placeholder="<h1>Nadpis</h1>&#10;<p>Text odstavce…</p>"><h1>Ahoj</h1>
<p>Toto je ukázkový <strong>HTML</strong> obsah.</p>
<ul><li>Položka 1</li><li>Položka 2</li></ul></textarea>
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="hp-size">Formát</label>
      <select class="select" id="hp-size"><option value="a4" selected>A4</option><option value="letter">Letter</option></select></div>
    <div class="stack-sm"><label class="field-label" for="hp-orient">Orientace</label>
      <select class="select" id="hp-orient"><option value="p" selected>Na výšku</option><option value="l">Na šířku</option></select></div>
    <div class="stack-sm"><label class="field-label" for="hp-scale">Měřítko (kvalita)</label>
      <select class="select" id="hp-scale"><option value="1">1×</option><option value="2" selected>2×</option><option value="3">3×</option></select></div>
    <button class="btn btn-primary btn-touch" id="hp-run" type="button"><?= icon_svg('FileCode', 18) ?> Vygenerovat PDF</button>
  </div>
  <div class="progress-track hidden" id="hp-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="hp-prog-label"></p>
  <p class="error-text hidden" id="hp-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Render přes html2canvas + jsPDF. Aktivní HTML, formuláře a vzdálené zdroje se před exportem odstraní. Stránkování je přibližné (jako jeden dlouhý obrázek rozdělený na stránky). Běží lokálně.</p>
</div>
