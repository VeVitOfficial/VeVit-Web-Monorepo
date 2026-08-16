<div class="stack" style="max-width:36rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local">Lokální</span>
  </div>

  <div class="row" style="gap:0.5rem">
    <input class="input input-mono" id="pw-out" readonly placeholder="Stiskněte Generovat" style="font-size:1.125rem;letter-spacing:0.05em;background:rgba(19,19,22,0.5)">
    <button class="btn btn-ghost btn-icon" id="pw-copy" disabled style="--ico:18">
      <span class="ico ico-copy"><?= icon_svg('Copy', 20) ?></span>
      <span class="ico ico-check hidden"><?= icon_svg('Check', 20) ?></span>
    </button>
  </div>

  <div class="stack-sm hidden" id="pw-strength-wrap">
    <div class="row-between" style="font-size:0.875rem">
      <span class="muted">Síla hesla</span>
      <span id="pw-strength-label"></span>
    </div>
    <div class="strength-track">
      <div class="strength-fill" id="pw-strength-bar"></div>
    </div>
  </div>

  <div class="pw-options">
    <div class="row-between">
      <span style="font-size:0.875rem">Délka: <span id="pw-len-label">16</span></span>
      <input type="range" min="4" max="64" value="16" id="pw-length">
    </div>
    <label class="pw-opt row-between">
      <span>Malá písmena (a-z)</span>
      <input type="checkbox" id="pw-lower" checked>
    </label>
    <label class="pw-opt row-between">
      <span>Velká písmena (A-Z)</span>
      <input type="checkbox" id="pw-upper" checked>
    </label>
    <label class="pw-opt row-between">
      <span>Číslice (0-9)</span>
      <input type="checkbox" id="pw-numbers" checked>
    </label>
    <label class="pw-opt row-between">
      <span>Speciální znaky</span>
      <input type="checkbox" id="pw-symbols" checked>
    </label>
  </div>

  <button class="btn btn-primary btn-block" id="pw-generate"><?= icon_svg('RefreshCw', 16) ?> Generovat</button>
</div>