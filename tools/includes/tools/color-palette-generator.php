<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="cp-base">Základní barva</label><input class="input mono" id="cp-base" type="text" value="#3b82f6"></div>
    <div class="stack-sm"><label class="field-label" for="cp-pick">Vybrat</label><input type="color" id="cp-pick" value="#3b82f6" style="width:4rem;height:2.5rem;border:none;background:none;cursor:pointer"></div>
    <div class="stack-sm"><label class="field-label" for="cp-scheme">Schéma</label>
      <select class="select" id="cp-scheme">
        <option value="complementary">Komplementární</option>
        <option value="analogous">Analogická</option>
        <option value="triadic">Triadická</option>
        <option value="tetradic">Tetradická</option>
        <option value="monochromatic">Monochromatická</option>
        <option value="shades">Odstíny</option>
      </select></div>
  </div>
  <div id="cp-out" class="row" style="flex-wrap:wrap;gap:0.75rem"></div>
  <p class="muted" style="font-size:0.8rem">Paleta se počítá v HSL lokálně. Klik na swatch zkopíruje hex hodnotu.</p>
</div>