<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="dd-from">Od (datum)</label>
      <input class="input" type="date" id="dd-from">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="dd-to">Do (datum)</label>
      <input class="input" type="date" id="dd-to">
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Rozdíl</span><span class="v accent" id="dd-days">—</span></div>
    <div class="kv"><span class="k">V týdnech</span><span class="v" id="dd-weeks">—</span></div>
    <div class="kv"><span class="k">V měsících</span><span class="v" id="dd-months">—</span></div>
    <div class="kv"><span class="k">V letech</span><span class="v" id="dd-years">—</span></div>
    <div class="kv"><span class="k">V hodinách</span><span class="v" id="dd-hours">—</span></div>
  </div>

  <p class="muted" style="font-size:0.8rem">Počítá se rozdíl kalendářních dnů. Výpočet běží živě v prohlížeči.</p>
</div>