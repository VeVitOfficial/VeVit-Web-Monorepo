<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pw-drop">
    <span class="dz-ico"><?= icon_svg('Stamp', 28) ?></span>
    <span class="dz-title">Přetáhněte PDF soubor</span>
    <span class="dz-hint">nebo klikněte pro výběr</span>
  </div>
  <div class="hidden" id="pw-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm" style="flex:1;min-width:12rem"><label class="field-label" for="pw-text">Text vodoznaku</label><input class="input" id="pw-text" type="text" value="VZOREK" placeholder="DŮVĚRNÉ"></div>
      <div class="stack-sm"><label class="field-label" for="pw-size">Velikost (pt)</label><input class="input" id="pw-size" type="number" value="48" min="12" max="200" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="pw-op">Průhlednost (%)</label><input type="range" id="pw-op" min="5" max="100" value="25" style="width:10rem"></div>
    </div>
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end;margin-top:0.75rem">
      <div class="stack-sm"><label class="field-label" for="pw-angle">Úhel (°)</label><input class="input" id="pw-angle" type="number" value="-45" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="pw-color">Barva</label><input type="color" id="pw-color" value="#888888" style="width:4rem;height:2.4rem;padding:0.2rem"></div>
      <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem;margin-bottom:0.35rem"><input type="checkbox" id="pw-tile"> Dlaždice (opakovat)</label>
    </div>
    <button class="btn btn-primary btn-touch" id="pw-run" type="button" disabled><?= icon_svg('Stamp', 18) ?> Přidat vodoznak a stáhnout</button>
  </div>
  <div class="progress-track hidden" id="pw-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pw-prog-label"></p>
  <p class="error-text hidden" id="pw-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Vodoznak přes pdf-lib (text, volitelná dlaždice). Běží lokálně.</p>
</div>