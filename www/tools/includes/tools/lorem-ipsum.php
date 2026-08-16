<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="li-count">Počet</label><input class="input" id="li-count" type="number" value="3" min="1" max="100"></div>
    <div class="stack-sm"><label class="field-label" for="li-unit">Jednotka</label>
      <select class="select" id="li-unit"><option value="paragraphs">Odstavce</option><option value="sentences">Věty</option><option value="words">Slova</option></select></div>
    <button class="btn btn-primary" id="li-gen" type="button"><?= icon_svg('Pilcrow', 16) ?> Generovat</button>
    <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.85rem"><input type="checkbox" id="li-classic" checked> Začít „Lorem ipsum…"</label>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="li-out">Text</label>
    <textarea class="textarea" id="li-out" rows="10" readonly></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-secondary" id="li-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem">Generuje zástupný text lokálně (klasické lorem ipsum slovo po slově).</p>
</div>