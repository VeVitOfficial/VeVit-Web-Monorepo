<div class="stack" style="max-width:36rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local">Lokální</span>
  </div>

  <div class="row" style="gap:1rem;align-items:center;margin-bottom:0.5rem">
    <div class="swatch" id="cc-swatch"></div>
    <div class="input-mono" id="cc-hex-display" style="font-size:1.5rem;font-weight:600">#10B981</div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="cc-hex">HEX</label>
    <div class="row" style="gap:0.5rem">
      <input class="input input-mono" id="cc-hex" value="#10b981">
      <button class="btn btn-ghost btn-icon cc-copy" data-key="hex">
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="cc-rgb">RGB</label>
    <div class="row" style="gap:0.5rem">
      <input class="input input-mono" id="cc-rgb" value="16, 185, 129">
      <button class="btn btn-ghost btn-icon cc-copy" data-key="rgb">
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
  </div>

  <div class="stack-sm">
    <label class="field-label" for="cc-hsl">HSL</label>
    <div class="row" style="gap:0.5rem">
      <input class="input input-mono" id="cc-hsl" value="153, 84%, 40%">
      <button class="btn btn-ghost btn-icon cc-copy" data-key="hsl">
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
  </div>
</div>