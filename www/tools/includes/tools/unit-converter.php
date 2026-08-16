<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="uc-cat" role="tablist" aria-label="Kategorie převodu">
    <button type="button" class="active" data-cat="length" role="tab" aria-selected="true">Délka</button>
    <button type="button" data-cat="mass" role="tab" aria-selected="false">Hmotnost</button>
    <button type="button" data-cat="temp" role="tab" aria-selected="false">Teplota</button>
    <button type="button" data-cat="volume" role="tab" aria-selected="false">Objem</button>
    <button type="button" data-cat="speed" role="tab" aria-selected="false">Rychlost</button>
  </div>

  <div class="two-col">
    <div class="stack-sm">
      <label class="field-label" for="uc-value">Hodnota</label>
      <input class="input" type="number" id="uc-value" value="1" inputmode="decimal">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="uc-from">Z</label>
      <select class="select" id="uc-from"></select>
    </div>
    <div class="stack-sm">
      <label class="field-label" for="uc-to">Do</label>
      <select class="select" id="uc-to"></select>
    </div>
    <div class="stack-sm" style="justify-content:flex-end">
      <button class="btn btn-ghost btn-sm" id="uc-swap" type="button"><?= icon_svg('RefreshCw', 16) ?> Prohodit</button>
    </div>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k" id="uc-result-k">Výsledek</span><span class="v accent" id="uc-result">—</span></div>
  </div>
</div>