<div class="stack" style="max-width:36rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local">Lokální</span>
  </div>

  <div class="row" style="gap:0.75rem">
    <input class="input input-mono" id="nb-value" value="255" placeholder="Zadejte číslo..." style="font-size:1.125rem;background:rgba(19,19,22,0.5)">
    <select class="select" id="nb-from">
      <option value="2">Binární</option>
      <option value="8">Oktálová</option>
      <option value="10" selected>Decimální</option>
      <option value="16">Hexadecimální</option>
    </select>
  </div>

  <div class="stack-sm" id="nb-rows">
    <div class="nb-row">
      <span class="label">Binární</span>
      <input class="input input-mono nb-out" data-radix="2" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="2" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
    <div class="nb-row">
      <span class="label">Oktálová</span>
      <input class="input input-mono nb-out" data-radix="8" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="8" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
    <div class="nb-row">
      <span class="label">Decimální</span>
      <input class="input input-mono nb-out" data-radix="10" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="10" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
    <div class="nb-row">
      <span class="label">Hexadecimální</span>
      <input class="input input-mono nb-out" data-radix="16" readonly>
      <button class="btn btn-ghost btn-icon nb-copy" data-radix="16" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
      </button>
    </div>
  </div>
</div>