<div class="stack" style="max-width:56rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <div class="row-between">
        <span class="muted" style="font-size:0.875rem;font-weight:500">Vstup (JSON)</span>
        <button class="btn btn-ghost btn-sm" id="jf-clear"><?= icon_svg('Trash', 16) ?> Vyčistit</button>
      </div>
      <textarea class="textarea input-mono" id="jf-input" placeholder='{"hello": "world"}' style="min-height:320px;background:rgba(19,19,22,0.5)"></textarea>
    </div>
    <div class="stack-sm">
      <div class="row-between">
        <span class="muted" style="font-size:0.875rem;font-weight:500">Výstup</span>
        <button class="btn btn-ghost btn-sm" id="jf-copy" disabled>
          <span class="ico ico-copy"><?= icon_svg('Copy', 16) ?></span>
          <span class="ico ico-check hidden"><?= icon_svg('Check', 16) ?></span>
          <span class="label">Kopírovat</span>
        </button>
      </div>
      <textarea class="textarea input-mono" id="jf-output" readonly style="min-height:320px;background:rgba(19,19,22,0.3)"></textarea>
    </div>
  </div>
  <p class="error-text hidden" id="jf-error"></p>
  <div class="row">
    <button class="btn btn-primary" id="jf-format"><?= icon_svg('AlignLeft', 16) ?> Formátovat</button>
    <button class="btn btn-secondary" id="jf-minify">Minifikovat</button>
  </div>
</div>