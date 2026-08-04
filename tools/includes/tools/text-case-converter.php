<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="tcc-in">Vstup</label>
    <textarea class="textarea mono" id="tcc-in" rows="5" placeholder="Zadejte text…"></textarea>
  </div>
  <div class="row" id="tcc-btns" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-ghost" type="button" data-fn="upper">VELKÁ PÍSMENA</button>
    <button class="btn btn-ghost" type="button" data-fn="lower">malá písmena</button>
    <button class="btn btn-ghost" type="button" data-fn="title">Title Case</button>
    <button class="btn btn-ghost" type="button" data-fn="sentence">Sentence case</button>
    <button class="btn btn-ghost" type="button" data-fn="camel">camelCase</button>
    <button class="btn btn-ghost" type="button" data-fn="pascal">PascalCase</button>
    <button class="btn btn-ghost" type="button" data-fn="snake">snake_case</button>
    <button class="btn btn-ghost" type="button" data-fn="kebab">kebab-case</button>
    <button class="btn btn-ghost" type="button" data-fn="const">CONSTANT_CASE</button>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="tcc-out">Výstup</label>
    <textarea class="textarea mono" id="tcc-out" rows="5" readonly></textarea>
    <button class="btn btn-secondary" id="tcc-copy" type="button" disabled style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> Kopírovat</button>
  </div>
  <p class="muted" style="font-size:0.8rem">Převod běží lokálně. Title Case respektuje českou diakritiku.</p>
</div>