<div class="stack" style="max-width:52rem;margin:0 auto">
  <div class="two-col">
    <div class="stack-sm">
      <span class="field-label">Dodavatel</span>
      <input class="input" id="iv-sup-name" type="text" placeholder="Název firmy" value="Jan Novák — Živnost">
      <textarea class="textarea" id="iv-sup-addr" rows="2" placeholder="Ulice 123\n123 45 Město">Dlouhá 1\n110 00 Praha</textarea>
      <input class="input" id="iv-sup-ico" type="text" placeholder="IČO" value="12345678">
      <input class="input" id="iv-sup-dic" type="text" placeholder="DIČ" value="CZ12345678">
    </div>
    <div class="stack-sm">
      <span class="field-label">Odběratel</span>
      <input class="input" id="iv-cus-name" type="text" placeholder="Název firmy/odběratele">
      <textarea class="textarea" id="iv-cus-addr" rows="2" placeholder="Ulice 123\n123 45 Město"></textarea>
      <input class="input" id="iv-cus-ico" type="text" placeholder="IČO">
    </div>
  </div>

  <div class="two-col" style="margin-top:1rem">
    <div class="stack-sm">
      <span class="field-label">Údaje faktury</span>
      <div class="row" style="flex-wrap:wrap;gap:0.5rem">
        <input class="input" id="iv-num" type="text" placeholder="Číslo faktury" value="2026001" style="flex:1;min-width:8rem">
        <input class="input" id="iv-date" type="date" id="iv-date">
      </div>
      <div class="row" style="flex-wrap:wrap;gap:0.5rem">
        <input class="input" id="iv-tax" type="date" placeholder="Datum zdanitelného plnění" style="flex:1;min-width:8rem">
        <input class="input" id="iv-due" type="date" placeholder="Splatnost">
      </div>
    </div>
    <div class="stack-sm">
      <span class="field-label">Platba</span>
      <input class="input" id="iv-iban" type="text" placeholder="IBAN" value="CZ0708000000001234567">
      <div class="row" style="flex-wrap:wrap;gap:0.5rem">
        <input class="input" id="iv-vs" type="text" placeholder="Variabilní symbol" value="2026001" style="flex:1;min-width:8rem">
        <input class="input" id="iv-ks" type="text" placeholder="Konstantní symbol" style="flex:1;min-width:6rem">
      </div>
    </div>
  </div>

  <div class="stack-sm" style="margin-top:1rem">
    <div class="row" style="flex-wrap:wrap;gap:0.5rem;align-items:end">
      <div class="stack-sm" style="flex:1;min-width:10rem"><label class="field-label" for="iv-vat">DPH (%)</label><input class="input" id="iv-vat" type="number" value="21" min="0" max="100" style="width:6rem"></div>
      <button class="btn btn-secondary" id="iv-add-row" type="button"><?= icon_svg('Plus', 16) ?> Přidat položku</button>
    </div>
    <div id="iv-rows" class="stack-sm"></div>
  </div>

  <div class="row" style="flex-wrap:wrap;gap:0.75rem;margin-top:1rem;align-items:center">
    <button class="btn btn-primary btn-touch" id="iv-run" type="button"><?= icon_svg('Receipt', 18) ?> Vygenerovat fakturu PDF</button>
    <label class="row" style="gap:0.4rem;align-items:center;font-size:0.85rem"><input type="checkbox" id="iv-qr" checked> Vložit QR kód platby (SPD)</label>
  </div>

  <div class="progress-track hidden" id="iv-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="iv-prog-label"></p>
  <p class="error-text hidden" id="iv-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Faktura přes pdf-lib + QR Platba (SPD, qrcode-generator). Běží lokálně — údaje neopustí prohlížeč. Není účetní software, jedná se o šablonu dokladu.</p>
</div>