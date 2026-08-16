<div class="stack" style="max-width:40rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="ps-pass">Heslo k analýze</label>
    <div class="row" style="gap:0.5rem">
      <input class="input" id="ps-pass" type="password" placeholder="Zadejte heslo…" autocomplete="off" style="flex:1">
      <button class="btn btn-ghost" id="ps-toggle" type="button" aria-label="Zobrazit/skrýt"><?= icon_svg('Eye', 16) ?></button>
    </div>
  </div>
  <div class="progress-track" id="ps-bar"><div class="progress-fill" id="ps-fill" style="width:0%"></div></div>
  <p class="muted" id="ps-label" style="font-size:0.85rem">—</p>
  <div class="glass" style="border-radius:0.75rem;padding:0.75rem 1rem" id="ps-detail">
    <div class="kv"><span class="k">Entropie</span><span class="v mono" id="ps-entropy">—</span></div>
    <div class="kv"><span class="k">Délka</span><span class="v mono" id="ps-len">—</span></div>
    <div class="kv"><span class="k">Sady znaků</span><span class="v" id="ps-sets">—</span></div>
    <div class="kv"><span class="k">Odhad doby prolomení</span><span class="v mono" id="ps-crack">—</span></div>
  </div>
  <p class="muted" style="font-size:0.78rem">Odhad je orientační (předpoklad 10<sup>10</sup> pokusů/s pro offline útok na hash). Skutečná odolnost závisí na typu úložiště. Heslo se nikam neodesílá — výpočet běží lokálně.</p>
</div>