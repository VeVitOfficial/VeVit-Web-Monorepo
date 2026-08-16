<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ns-gross">Hrubá mzda měsíčně (Kč)</label>
      <input class="input" type="number" id="ns-gross" min="0" step="500" value="40000" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ns-children">Počet dětí</label>
      <input class="input" type="number" id="ns-children" min="0" max="10" step="1" value="0" inputmode="numeric">
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="ns-discount">Sleva na poplatníka</label>
    <select class="select" id="ns-discount">
      <option value="1" selected>Ano (2 570 Kč / měsíc)</option>
      <option value="0">Ne</option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Odvody zaměstnance (11 %)</span><span class="v" id="ns-levy">—</span></div>
    <div class="kv"><span class="k">Záloha na daň</span><span class="v" id="ns-tax">—</span></div>
    <div class="kv"><span class="k">Čistá mzda</span><span class="v accent" id="ns-net">—</span></div>
    <div class="kv"><span class="k">Efektivní zdanění</span><span class="v" id="ns-eff">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem">Orientační odhad pro rok 2024 (sazba 15 %, superhrubá = hrubá × 1,34, odvody zaměstnance 6,5 % + 4,5 %, sleva na poplatníka 2 570 Kč, daňové zvýhodnění na dítě 1 467 / 2 170 / 2 520 Kč). Nejedná se o daňové poradenství. Výpočet běží živě v prohlížeči.</p>
</div>