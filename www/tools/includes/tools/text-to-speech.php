<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="ts-in">Text</label>
    <textarea class="textarea" id="ts-in" rows="6" placeholder="Zadejte text k přečtení…"></textarea>
  </div>
  <div class="two-col" style="gap:0.75rem">
    <div class="stack-sm"><label class="field-label" for="ts-voice">Hlas</label><select class="select" id="ts-voice"><option value="">Načítám…</option></select></div>
    <div class="stack-sm"><label class="field-label" for="ts-lang">Jazyk (filtr)</label><select class="select" id="ts-lang"><option value="">Všechny</option></select></div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ts-rate">Rychlost: <span id="ts-rate-v">1.0</span>×</label>
    <input type="range" id="ts-rate" min="0.5" max="2" step="0.1" value="1" style="width:100%">
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ts-pitch">Výška: <span id="ts-pitch-v">1.0</span>×</label>
    <input type="range" id="ts-pitch" min="0" max="2" step="0.1" value="1" style="width:100%">
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="ts-speak" type="button"><?= icon_svg('Volume2', 16) ?> Přečíst</button>
    <button class="btn btn-secondary" id="ts-pause" type="button">Pozastavit</button>
    <button class="btn btn-ghost" id="ts-stop" type="button">Zastavit</button>
  </div>
  <p class="error-text hidden" id="ts-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Používá Web Speech API prohlížeče. Český hlas nemusí být dostupný — záleží na systému/OS. Nic se neodesílá na server (vyjma hlasů, jež dodává prohlížeč/OS).</p>
</div>