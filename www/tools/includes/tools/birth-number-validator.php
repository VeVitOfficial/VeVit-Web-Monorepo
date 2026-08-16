<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="bn-input">Rodné číslo</label>
    <input class="input mono" type="text" id="bn-input" placeholder="RRMMDD/XXXX" autocomplete="off" style="max-width:14rem">
  </div>

  <button class="btn btn-primary btn-touch" id="bn-run" type="button"><?= icon_svg('BadgeCheck', 16) ?> Ověřit</button>

  <div class="glass" style="border-radius:0.75rem;padding:0.5rem 1rem" role="status" aria-live="polite">
    <div class="kv"><span class="k">Stav</span><span class="v accent" id="bn-status">—</span></div>
    <div class="kv hidden" id="bn-dob-row"><span class="k">Datum narození</span><span class="v" id="bn-dob">—</span></div>
    <div class="kv hidden" id="bn-sex-row"><span class="k">Pohlaví</span><span class="v" id="bn-sex">—</span></div>
    <div class="kv hidden" id="bn-age-row"><span class="k">Věk</span><span class="v" id="bn-age">—</span></div>
  </div>

  <p class="error-text hidden" id="bn-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Ověřuje se formát a kontrolní součet (mod 11). Zpracování probíhá výhradně ve vašem prohlížeči — rodné číslo se nikam neukládá ani neodesílá.</p>
</div>