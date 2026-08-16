<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="tc-mode" role="tablist" aria-label="Směr převodu">
    <button type="button" class="active" data-mode="t2d" role="tab" aria-selected="true">Timestamp → datum</button>
    <button type="button" data-mode="d2t" role="tab" aria-selected="false">Datum → timestamp</button>
  </div>

  <div id="tc-t2d" class="tc-group" data-for="t2d">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm" style="flex:1;min-width:12rem">
        <label class="field-label" for="tc-ts">Unix timestamp</label>
        <input class="input mono" id="tc-ts" type="text" placeholder="1700000000" autocomplete="off">
      </div>
      <div class="stack-sm">
        <label class="field-label" for="tc-unit">Jednotka</label>
        <select class="select" id="tc-unit">
          <option value="s">sekundy</option>
          <option value="ms">milisekundy</option>
        </select>
      </div>
    </div>
  </div>

  <div id="tc-d2t" class="tc-group hidden" data-for="d2t">
    <div class="stack-sm">
      <label class="field-label" for="tc-date">Datum a čas</label>
      <input class="input mono" id="tc-date" type="datetime-local" step="1">
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="tc-tz">Časové pásmo</label>
    <select class="select" id="tc-tz">
      <option value="local">Místní</option>
      <option value="UTC">UTC</option>
      <option value="Europe/Prague">Europe/Prague</option>
      <option value="Europe/London">Europe/London</option>
      <option value="America/New_York">America/New_York</option>
      <option value="Asia/Tokyo">Asia/Tokyo</option>
    </select>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem">
    <div class="kv"><span class="k">Výsledek</span><span class="v mono" id="tc-out">—</span></div>
    <div class="kv"><span class="k">Relativně</span><span class="v" id="tc-rel">—</span></div>
  </div>
  <p class="error-text hidden" id="tc-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Převod běží lokálně v prohlížeči (Intl.DateTimeFormat pro pásma, nic se neodesílá).</p>
</div>