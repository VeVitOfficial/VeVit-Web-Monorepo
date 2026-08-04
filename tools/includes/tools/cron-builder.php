<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="stack-sm">
    <span class="field-label">Předvolby</span>
    <div class="row" style="flex-wrap:wrap;gap:0.5rem" id="cb-presets">
      <button class="btn btn-ghost" data-cron="* * * * *" type="button">Každou minutu</button>
      <button class="btn btn-ghost" data-cron="0 * * * *" type="button">Každou hodinu</button>
      <button class="btn btn-ghost" data-cron="0 0 * * *" type="button">Denně půlnoc</button>
      <button class="btn btn-ghost" data-cron="0 0 * * 0" type="button">Neděle půlnoc</button>
      <button class="btn btn-ghost" data-cron="0 0 1 * *" type="button">Měsíčně 1.</button>
      <button class="btn btn-ghost" data-cron="0 17 * * 5" type="button">Pátek 17:00</button>
    </div>
  </div>
  <div class="two-col" style="gap:0.75rem">
    <div class="stack-sm">
      <label class="field-label" for="cb-min">Minuta (0–59)</label>
      <input class="input mono" id="cb-min" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-hour">Hodina (0–23)</label>
      <input class="input mono" id="cb-hour" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-dom">Den v měsíci (1–31)</label>
      <input class="input mono" id="cb-dom" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-mon">Měsíc (1–12)</label>
      <input class="input mono" id="cb-mon" type="text" value="*" autocomplete="off">
    </div>
    <div class="stack-sm">
      <label class="field-label" for="cb-dow">Den v týdnu (0–6, 0=ne)</label>
      <input class="input mono" id="cb-dow" type="text" value="*" autocomplete="off">
    </div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="cb-expr">Cron výraz</label>
    <input class="input mono" id="cb-expr" type="text" value="* * * * *" autocomplete="off">
    <button class="btn btn-secondary" id="cb-copy" type="button" style="margin-top:0.5rem"><?= icon_svg('Copy', 16) ?> Kopírovat výraz</button>
  </div>
  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem">
    <div class="kv"><span class="k">Význam</span><span class="v" id="cb-desc">—</span></div>
  </div>
  <p class="error-text hidden" id="cb-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Pět polí: minuta hodina den-měsíc měsíc den-týdne. Podporuje *, konkrétní hodnoty, čárky, pomlčky a kroky (*/N).</p>
</div>