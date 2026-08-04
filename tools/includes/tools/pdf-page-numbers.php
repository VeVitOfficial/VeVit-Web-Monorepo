<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pn-drop">
    <span class="dz-ico"><?= icon_svg('Hash', 28) ?></span>
    <span class="dz-title">Přetáhněte PDF soubor</span>
    <span class="dz-hint">nebo klikněte pro výběr</span>
  </div>
  <div class="hidden" id="pn-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="pn-pos">Pozice</label>
        <select class="select" id="pn-pos">
          <option value="bl">Dole vlevo</option><option value="bc" selected>Dole uprostřed</option><option value="br">Dole vpravo</option>
          <option value="tl">Nahoře vlevo</option><option value="tc">Nahoře uprostřed</option><option value="tr">Nahoře vpravo</option>
        </select></div>
      <div class="stack-sm"><label class="field-label" for="pn-start">Počáteční číslo</label><input class="input" id="pn-start" type="number" value="1" min="0" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="pn-fmt">Formát</label>
        <select class="select" id="pn-fmt"><option value="{n}">{n}</option><option value="{n}/{t}" selected>{n}/{t}</option><option value="Strana {n} z {t}">Strana {n} z {t}</option></select></div>
      <div class="stack-sm"><label class="field-label" for="pn-size">Velikost (pt)</label><input class="input" id="pn-size" type="number" value="10" min="6" max="24" style="width:6rem"></div>
    </div>
    <button class="btn btn-primary btn-touch" id="pn-run" type="button" disabled><?= icon_svg('Hash', 18) ?> Přidat čísla a stáhnout</button>
  </div>
  <div class="progress-track hidden" id="pn-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pn-prog-label"></p>
  <p class="error-text hidden" id="pn-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Číslování přes pdf-lib. Běží lokálně.</p>
</div>