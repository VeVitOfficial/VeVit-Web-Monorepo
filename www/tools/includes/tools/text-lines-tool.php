<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="lt-in">Vstup (řádek = jeden záznam)</label>
    <textarea class="textarea mono" id="lt-in" rows="8" placeholder="řádek 1\nřádek 2…"></textarea>
  </div>
  <div class="row" id="lt-btns" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-ghost" type="button" data-op="sort">Seřadit A→Z</button>
    <button class="btn btn-ghost" type="button" data-op="sortdesc">Seřadit Z→A</button>
    <button class="btn btn-ghost" type="button" data-op="unique">Odstranit duplicity</button>
    <button class="btn btn-ghost" type="button" data-op="trim">Oříznout mezery</button>
    <button class="btn btn-ghost" type="button" data-op="nonempty">Smazat prázdné</button>
    <button class="btn btn-ghost" type="button" data-op="reverse">Obrátit pořadí</button>
    <button class="btn btn-ghost" type="button" data-op="shuffle">Náhodně</button>
    <button class="btn btn-ghost" type="button" data-op="number">Očíslovat</button>
    <button class="btn btn-ghost" type="button" data-op="dedup-blank">Sbalit prázdné</button>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="lt-out">Výstup</label>
    <textarea class="textarea mono" id="lt-out" rows="8" readonly></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-secondary" id="lt-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
      <button class="btn btn-ghost" id="lt-back" type="button">⇅ Použít výstup jako vstup</button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem">Vše běží lokálně.</p>
</div>