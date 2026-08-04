<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="bmr-sex">Pohlaví</label>
      <select class="select" id="bmr-sex">
        <option value="m">Muž</option>
        <option value="f">Žena</option>
      </select>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="bmr-age">Věk (roky)</label>
      <input class="input" type="number" id="bmr-age" min="1" max="120" step="1" value="30" inputmode="numeric">
    </div>
  </div>
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="bmr-height">Výška (cm)</label>
      <input class="input" type="number" id="bmr-height" min="80" max="250" step="0.5" value="175" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="bmr-weight">Váha (kg)</label>
      <input class="input" type="number" id="bmr-weight" min="20" max="400" step="0.1" value="70" inputmode="decimal">
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="bmr-act">Aktivita</label>
    <select class="select" id="bmr-act">
      <option value="1.2">Převážně sedavý</option>
      <option value="1.375" selected>Lehká aktivita (1–3×/týden)</option>
      <option value="1.55">Střední aktivita (3–5×/týden)</option>
      <option value="1.725">Těžká aktivita (6–7×/týden)</option>
      <option value="1.9">Velmi těžká aktivita (fyzická práce)</option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">BMR (klidový metabolismus)</span><span class="v" id="bmr-bmr">—</span></div>
    <div class="kv"><span class="k">Denní spotřeba (TDEE)</span><span class="v accent" id="bmr-tdee">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem">Vzorec Mifflin-St Jeor. Orientační odhad — skutečná spotřeba se liší podle tělesné konstituce. Výpočet běží živě v prohlížeči.</p>
</div>