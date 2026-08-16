<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="seg" id="sg-mode" role="tablist">
    <button type="button" class="active" data-mode="enc" role="tab" aria-selected="true">Skrýt text</button>
    <button type="button" data-mode="dec" role="tab" aria-selected="false">Vytáhnout text</button>
  </div>
  <div class="dropzone" id="sg-drop">
    <span class="dz-ico"><?= icon_svg('EyeOff', 28) ?></span>
    <span class="dz-title">Přetáhněte obrázek (PNG)</span>
    <span class="dz-hint">LSB skrývání — funguje jen na bezztrátové formáty (PNG)</span>
  </div>
  <div class="file-list hidden" id="sg-list"></div>
  <div class="hidden" id="sg-enc-grp">
    <div class="stack-sm">
      <label class="field-label" for="sg-text">Tajná zpráva</label>
      <textarea class="textarea" id="sg-text" rows="4" placeholder="Text ke skrytí…"></textarea>
    </div>
    <button class="btn btn-primary btn-touch" id="sg-enc" type="button" disabled><?= icon_svg('Download', 18) ?> Skrýt a stáhnout PNG</button>
  </div>
  <div class="hidden" id="sg-dec-grp">
    <button class="btn btn-primary btn-touch" id="sg-dec" type="button" disabled><?= icon_svg('Eye', 18) ?> Vytáhnout zprávu</button>
    <div class="stack-sm" style="margin-top:0.75rem">
      <label class="field-label">Skrytá zpráva</label>
      <textarea class="textarea" id="sg-out" rows="4" readonly placeholder="Výsledek se zobrazí zde…"></textarea>
    </div>
  </div>
  <div class="progress-track hidden" id="sg-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="sg-prog-label"></p>
  <p class="error-text hidden" id="sg-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">LSG (Least Significant Bit) do RGB kanálů. Běží lokálně. PNG se překóduje přes canvas — původní metadata se nemažou, ale skrytá data zůstávají. JPEG nelze použít (ztrátová komprese zprávu zničí).</p>
</div>