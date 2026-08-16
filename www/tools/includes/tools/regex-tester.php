<div class="stack" style="max-width:48rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local">Lokální</span>
  </div>

  <div class="row" style="gap:0.75rem;align-items:flex-end">
    <div class="stack-sm" style="flex:1">
      <label class="field-label" for="rx-pattern">Regulární výraz</label>
      <input class="input input-mono" id="rx-pattern" placeholder="např. \d+">
    </div>
    <div class="stack-sm" style="width:6rem">
      <label class="field-label" for="rx-flags">Flags</label>
      <input class="input input-mono" id="rx-flags" placeholder="gi" value="g">
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="rx-text">Testovací text</label>
    <textarea class="textarea input-mono" id="rx-text" placeholder="Vložte text k testování..." style="min-height:120px;background:rgba(19,19,22,0.5)"></textarea>
  </div>

  <p class="error-text hidden" id="rx-error"></p>

  <div class="stack-sm hidden" id="rx-out-wrap">
    <div class="regex-out input-mono" id="rx-highlight"></div>
    <div style="font-size:0.875rem">
      <span style="font-weight:500">Nalezeno shod: </span><span id="rx-count">0</span>
    </div>
  </div>
</div>