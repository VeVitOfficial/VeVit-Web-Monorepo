<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="iban-mode" role="tablist" aria-label="Směr převodu IBAN">
    <button type="button" class="active" data-mode="to" role="tab" aria-selected="true">Účet → IBAN</button>
    <button type="button" data-mode="from" role="tab" aria-selected="false">IBAN → účet</button>
  </div>

  <div class="stack-sm" id="iban-to">
    <label class="field-label" for="iban-acc">České číslo účtu (např. 123456789/0800)</label>
    <input class="input mono" type="text" id="iban-acc" placeholder="předčíslí-číslo/kód" autocomplete="off">
  </div>

  <div class="stack-sm hidden" id="iban-from">
    <label class="field-label" for="iban-iban">IBAN (český)</label>
    <input class="input mono" type="text" id="iban-iban" placeholder="CZ..." autocomplete="off">
  </div>

  <div class="row" style="flex-wrap:wrap">
    <button class="btn btn-primary btn-touch" id="iban-run" type="button"><?= icon_svg('RefreshCw', 16) ?> Převést</button>
    <button class="btn btn-ghost" id="iban-copy" type="button" disabled><?= icon_svg('Copy', 16) ?> Kopírovat</button>
  </div>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k" id="iban-out-k">IBAN</span><span class="v accent mono" id="iban-out">—</span></div>
    <div class="kv hidden" id="iban-det-row"><span class="k">Banka / kód</span><span class="v mono" id="iban-det">—</span></div>
  </div>

  <p class="error-text hidden" id="iban-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Převod běží lokálně v prohlížeči. Kód banky je povinný (např. /0800). Formát se neodesílá nikam.</p>
</div>