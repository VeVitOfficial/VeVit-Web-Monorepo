<div class="stack" style="max-width:50rem;margin:0 auto">
  <span class="field-label">Vyberte jazyky / nástroje</span>
  <div id="gi-checks" class="row" style="flex-wrap:wrap;gap:0.5rem"></div>
  <div class="stack-sm">
    <label class="field-label" for="gi-out">.gitignore</label>
    <textarea class="textarea mono" id="gi-out" rows="16" readonly></textarea>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem">
      <button class="btn btn-secondary" id="gi-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
      <button class="btn btn-ghost" id="gi-clear" type="button">Zrušit výběr</button>
    </div>
  </div>
  <p class="muted" style="font-size:0.8rem">Šablony jsou statické (vestavěné). Běží lokálně, nic se neodesílá.</p>
</div>