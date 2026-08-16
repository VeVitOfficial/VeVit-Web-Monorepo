<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="seg" id="qr-type" role="tablist" aria-label="Typ obsahu">
    <button type="button" class="active" data-type="text" role="tab" aria-selected="true">Text</button>
    <button type="button" data-type="url" role="tab" aria-selected="false">URL</button>
    <button type="button" data-type="wifi" role="tab" aria-selected="false">Wi-Fi</button>
    <button type="button" data-type="vcard" role="tab" aria-selected="false">vCard</button>
  </div>

  <div class="qr-group" data-for="text">
    <div class="stack-sm"><label class="field-label" for="qr-text">Text</label>
      <textarea class="textarea mono" id="qr-text" rows="3" placeholder="Cokoliv…"></textarea></div>
  </div>
  <div class="qr-group hidden" data-for="url">
    <div class="stack-sm"><label class="field-label" for="qr-url">URL</label>
      <input class="input mono" id="qr-url" type="text" placeholder="https://example.com"></div>
  </div>
  <div class="qr-group hidden" data-for="wifi">
    <div class="two-col" style="gap:0.75rem">
      <div class="stack-sm"><label class="field-label" for="qr-ssid">SSID (název sítě)</label><input class="input" id="qr-ssid" type="text"></div>
      <div class="stack-sm"><label class="field-label" for="qr-wpass">Heslo</label><input class="input mono" id="qr-wpass" type="text"></div>
    </div>
    <div class="stack-sm"><label class="field-label" for="qr-enc">Šifrování</label>
      <select class="select" id="qr-enc"><option>WPA/WPA2</option><option>WEP</option><option>None</option></select></div>
    <label style="display:flex;gap:0.5rem;align-items:center;font-size:0.85rem"><input type="checkbox" id="qr-hidden"> Skrytá síť</label>
  </div>
  <div class="qr-group hidden" data-for="vcard">
    <div class="two-col" style="gap:0.75rem">
      <div class="stack-sm"><label class="field-label" for="qr-vn">Jméno</label><input class="input" id="qr-vn" type="text"></div>
      <div class="stack-sm"><label class="field-label" for="qr-vp">Příjmení</label><input class="input" id="qr-vp" type="text"></div>
    </div>
    <div class="stack-sm"><label class="field-label" for="qr-vt">Telefon</label><input class="input mono" id="qr-vt" type="text" placeholder="+420…"></div>
    <div class="stack-sm"><label class="field-label" for="qr-ve">E-mail</label><input class="input mono" id="qr-ve" type="text"></div>
    <div class="stack-sm"><label class="field-label" for="qr-vu">URL</label><input class="input mono" id="qr-vu" type="text"></div>
  </div>

  <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
    <div class="stack-sm"><label class="field-label" for="qr-ec">Korekce chyb</label>
      <select class="select" id="qr-ec"><option value="L">L (~7 %)</option><option value="M" selected>M (~15 %)</option><option value="Q">Q (~25 %)</option><option value="H">H (~30 %)</option></select></div>
    <div class="stack-sm"><label class="field-label" for="qr-size">Velikost</label>
      <select class="select" id="qr-size"><option value="4">Malá</option><option value="6" selected>Střední</option><option value="8">Velká</option><option value="10">XL</option></select></div>
  </div>

  <div style="text-align:center"><img id="qr-img" alt="QR kód" style="max-width:100%;width:256px;height:256px;background:#fff;padding:8px;border-radius:0.5rem"></div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem;justify-content:center">
    <button class="btn btn-secondary" id="qr-dl" type="button" disabled><?= icon_svg('Download', 16) ?> Stáhnout PNG</button>
  </div>
  <p class="error-text hidden" id="qr-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Generování přes qrcode-generator (lazy-load). Běží lokálně, data neopustí prohlížeč.</p>
</div>