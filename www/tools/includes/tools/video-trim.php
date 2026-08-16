<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vt2-drop">
    <span class="dz-ico"><?= icon_svg('Scissors', 28) ?></span>
    <span class="dz-title">Přetáhněte video k oříznutí</span>
    <span class="dz-hint">ffmpeg.wasm — výběr časového úseku</span>
  </div>
  <div class="file-list hidden" id="vt2-list"></div>
  <div class="hidden" id="vt2-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="vt2-start">Začátek (HH:MM:SS)</label><input class="input" id="vt2-start" type="text" value="00:00:00" placeholder="00:00:05"></div>
      <div class="stack-sm"><label class="field-label" for="vt2-end">Konec (HH:MM:SS)</label><input class="input" id="vt2-end" type="text" placeholder="00:00:30"></div>
      <div class="stack-sm"><label class="field-label" for="vt2-reenc">Překódovat (přesnější)</label><select class="select" id="vt2-reenc"><option value="0" selected>Kopírovat (rychlé)</option><option value="1">Překódovat</option></select></div>
    </div>
    <button class="btn btn-primary btn-touch" id="vt2-run" type="button" disabled><?= icon_svg('Scissors', 18) ?> Oříznout</button>
  </div>
  <div class="progress-track hidden" id="vt2-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vt2-prog-label"></p>
  <p class="error-text hidden" id="vt2-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Ořez přes ffmpeg.wasm. „Kopírovat" je rychlé ale ořezá na klíčových snímcích; „Překódovat" je přesné. Běží lokálně.</p>
</div>