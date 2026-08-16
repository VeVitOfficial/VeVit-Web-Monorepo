<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="two-col" style="gap:1rem">
    <div class="stack-sm">
      <div class="stack-sm"><label class="field-label" for="og-title">Titulek (og:title)</label><input class="input" id="og-title" type="text" placeholder="Můj web"></div>
      <div class="stack-sm"><label class="field-label" for="og-desc">Popis (og:description)</label><textarea class="textarea" id="og-desc" rows="3" placeholder="Krátký popis stránky"></textarea></div>
      <div class="stack-sm"><label class="field-label" for="og-url">URL (og:url)</label><input class="input mono" id="og-url" type="text" placeholder="https://example.com"></div>
      <div class="stack-sm"><label class="field-label" for="og-img">Obrázek (og:image)</label><input class="input mono" id="og-img" type="text" placeholder="https://example.com/og.png"></div>
      <div class="stack-sm"><label class="field-label" for="og-site">Název webu (og:site_name)</label><input class="input" id="og-site" type="text"></div>
      <div class="stack-sm"><label class="field-label" for="og-type">Typ (og:type)</label>
        <select class="select" id="og-type"><option>website</option><option>article</option><option>product</option><option>profile</option></select></div>
    </div>
    <div class="stack-sm">
      <span class="field-label">Náhled karty</span>
      <div class="glass" style="border-radius:0.75rem;overflow:hidden;padding:0">
        <div id="og-card-img" style="height:140px;background:#1f2937;display:flex;align-items:center;justify-content:center;color:#6b7280;background-size:cover;background-position:center">Bez obrázku</div>
        <div style="padding:0.75rem">
          <div id="og-card-site" class="muted" style="font-size:0.75rem">example.com</div>
          <div id="og-card-title" style="font-weight:600;margin:0.2rem 0">Titulek stránky</div>
          <div id="og-card-desc" class="muted" style="font-size:0.8rem">Popis stránky…</div>
        </div>
      </div>
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="og-out">Meta tagy (HTML)</label>
    <textarea class="textarea mono" id="og-out" rows="11" readonly></textarea>
    <button class="btn btn-secondary" id="og-copy" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> Kopírovat</button>
  </div>
  <p class="muted" style="font-size:0.8rem">Generuje Open Graph + Twitter Card meta tagy. Běží lokálně, nic se neodesílá.</p>
</div>