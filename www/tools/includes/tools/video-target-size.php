<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vts-drop">
    <span class="dz-ico"><?= icon_svg('Scale', 28) ?></span>
    <span class="dz-title">Přetáhněte video</span>
    <span class="dz-hint">Zkompresuje na cílovou velikost (ffmpeg.wasm)</span>
  </div>
  <div class="file-list hidden" id="vts-list"></div>
  <div class="hidden" id="vts-work">
    <div class="row" style="flex-wrap:wrap;gap:0.75rem;align-items:end">
      <div class="stack-sm"><label class="field-label" for="vts-mb">Cílová velikost (MB)</label><input class="input" id="vts-mb" type="number" value="25" min="1" max="500" step="0.5" style="width:6rem"></div>
      <div class="stack-sm"><label class="field-label" for="vts-dur">Délka (s, auto)</label><input class="input" id="vts-dur" type="number" min="0" step="0.1" style="width:6rem" placeholder="auto" readonly></div>
    </div>
    <button class="btn btn-primary btn-touch" id="vts-run" type="button" disabled><?= icon_svg('Scale', 18) ?> Komprimovat na cílovou velikost</button>
  </div>
  <div class="progress-track hidden" id="vts-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vts-prog-label"></p>
  <p class="error-text hidden" id="vts-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Dopočet bitrate z cílové velikosti a délky (dvouprůchodový režim by byl pomalejší; zde jednorázový -b:v + maxrate). Audio 128 kbps AAC. Limit ~100 MB. Běží lokálně.</p>
</div>