<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="pc-mode" role="tablist" aria-label="Režim výpočtu procent">
    <button type="button" class="active" data-mode="of" role="tab" aria-selected="true">Kolik je X % z Y</button>
    <button type="button" data-mode="pct" role="tab" aria-selected="false">X je kolik % z Y</button>
    <button type="button" data-mode="delta" role="tab" aria-selected="false">Zvýšení / snížení</button>
  </div>

  <div class="stack-sm" id="pc-inputs">
    <div class="pc-group" data-for="of">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem 0.75rem;align-items:center">
        <span class="muted" style="font-size:0.875rem">Kolik je</span>
        <input class="input" type="number" id="pc-of-a" style="width:7rem" inputmode="decimal" placeholder="25">
        <span class="muted" style="font-size:0.875rem">% z</span>
        <input class="input" type="number" id="pc-of-b" style="width:9rem" inputmode="decimal" placeholder="200">
        <span class="muted" style="font-size:0.875rem">?</span>
      </div>
    </div>
    <div class="pc-group hidden" data-for="pct">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem 0.75rem;align-items:center">
        <input class="input" type="number" id="pc-pct-a" style="width:7rem" inputmode="decimal" placeholder="50">
        <span class="muted" style="font-size:0.875rem">je kolik % z</span>
        <input class="input" type="number" id="pc-pct-b" style="width:9rem" inputmode="decimal" placeholder="200">
        <span class="muted" style="font-size:0.875rem">?</span>
      </div>
    </div>
    <div class="pc-group hidden" data-for="delta">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem 0.75rem;align-items:center">
        <span class="muted" style="font-size:0.875rem">Z</span>
        <input class="input" type="number" id="pc-dl-from" style="width:7rem" inputmode="decimal" placeholder="100">
        <span class="muted" style="font-size:0.875rem">na</span>
        <input class="input" type="number" id="pc-dl-to" style="width:7rem" inputmode="decimal" placeholder="125">
      </div>
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Výsledek</span><span class="v accent" id="pc-result">—</span></div>
    <div class="kv hidden" id="pc-detail-row"><span class="k" id="pc-detail-k">Rozdíl</span><span class="v" id="pc-detail-v">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem">Výpočet běží živě v prohlížeči při psaní.</p>
</div>