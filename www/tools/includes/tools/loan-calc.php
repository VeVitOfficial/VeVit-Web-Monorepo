<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="ln-amount">Částka (Kč)</label>
      <input class="input" type="number" id="ln-amount" min="0" step="1000" value="500000" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ln-rate">Úroková sazba p.a. (%)</label>
      <input class="input" type="number" id="ln-rate" min="0" step="0.01" value="6.5" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ln-years">Doba (roky)</label>
      <input class="input" type="number" id="ln-years" min="1" max="40" step="1" value="20" inputmode="numeric">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="ln-freq">Frekvence splácení</label>
      <select class="select" id="ln-freq">
        <option value="12">Měsíčně</option>
        <option value="4">Čtvrtletně</option>
        <option value="2">Půletálně</option>
        <option value="1">Ročně</option>
      </select>
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.25rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Pravidelná splátka</span><span class="v accent" id="ln-payment">—</span></div>
    <div class="kv"><span class="k">Celkem zaplaceno</span><span class="v" id="ln-total">—</span></div>
    <div class="kv"><span class="k">Z toho úroky</span><span class="v" id="ln-interest">—</span></div>
    <div class="kv"><span class="k">Počet splátek</span><span class="v" id="ln-count">—</span></div>
  </div>

  <details class="accordion">
    <summary>Amortizační tabulka <span class="acc-chev"><?= icon_svg('ChevronDown', 16) ?></span></summary>
    <div class="acc-body">
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>#</th><th>Splátka</th><th>Úrok</th><th>Jistina</th><th>Zůstatek</th></tr></thead>
          <tbody id="ln-table"></tbody>
        </table>
      </div>
    </div>
  </details>

  <p class="muted" style="font-size:0.8rem">Modelový výpočet anuitní splátky. Slouží pro orientaci, ne jako nabídka úvěru.</p>
</div>