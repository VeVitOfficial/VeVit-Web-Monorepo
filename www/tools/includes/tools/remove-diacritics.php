<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="rd-in">Vstup</label>
    <textarea class="textarea" id="rd-in" rows="5" placeholder="Píšete text s diakritikou…"></textarea>
  </div>
  <button class="btn btn-primary" id="rd-run" type="button"><?= icon_svg('SpellCheck', 16) ?> Odstranit diakritiku</button>
  <div class="stack-sm">
    <label class="field-label" for="rd-out">Výstup</label>
    <textarea class="textarea" id="rd-out" rows="5" readonly></textarea>
    <button class="btn btn-secondary" id="rd-copy" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> Kopírovat</button>
  </div>
  <p class="muted" style="font-size:0.8rem">Používá Unicode NFD normalizaci (odstraní kombinační značky). Běží lokálně.</p>
</div>