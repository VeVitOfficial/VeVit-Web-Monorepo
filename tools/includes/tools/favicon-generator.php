<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="dropzone" id="fg-drop">
    <span class="dz-ico"><?= icon_svg('Globe', 28) ?></span>
    <span class="dz-title">Přetáhněte obrázek (logo)</span>
    <span class="dz-hint">PNG s průhledností doporučeno (čtvercový ideál)</span>
  </div>
  <div class="hidden" id="fg-work">
    <div class="row" style="flex-wrap:wrap;gap:1rem;align-items:center;margin-top:0.75rem">
      <div class="stack-sm"><label class="field-label">Velikosti</label>
        <div class="row" style="flex-wrap:wrap;gap:0.5rem">
          <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" class="fg-sz" value="16" checked>16</label>
          <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" class="fg-sz" value="32" checked>32</label>
          <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" class="fg-sz" value="48" checked>48</label>
          <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" class="fg-sz" value="64" checked>64</label>
          <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" class="fg-sz" value="128" checked>128</label>
          <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" class="fg-sz" value="256" checked>256</label>
          <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" class="fg-sz" value="512" checked>512</label>
        </div>
      </div>
      <div class="stack-sm"><label class="field-label" for="fg-bg">Pozadí (místo průhlednosti)</label><input type="color" id="fg-bg" value="#ffffff" style="width:4rem;height:2.4rem;padding:0.2rem"></div>
    </div>
    <div id="fg-preview" class="row" style="flex-wrap:wrap;gap:1rem;align-items:end;margin-top:1rem"></div>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:1rem">
      <button class="btn btn-primary" id="fg-dl-ico" type="button" disabled><?= icon_svg('Download', 16) ?> Stáhnout favicon.ico</button>
      <button class="btn btn-secondary" id="fg-dl-zip" type="button" disabled><?= icon_svg('Download', 16) ?> Stáhnout ZIP (PNG + ICO)</button>
    </div>
  </div>
  <p class="error-text hidden" id="fg-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Generuje PNG různých velikostí + favicon.ico (PNG-blob záznamy). ZIP přes jszip (lazy-load). Běží lokálně.</p>
</div>