<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="stack-sm">
    <label class="field-label" for="ts-in"><?= e(vv_t('text_to_speech.text', $lang)) ?></label>
    <textarea class="textarea" id="ts-in" rows="6" placeholder="<?= e(vv_t('text_to_speech.ph', $lang)) ?>"></textarea>
  </div>
  <div class="two-col" style="gap:0.75rem">
    <div class="stack-sm"><label class="field-label" for="ts-voice"><?= e(vv_t('text_to_speech.voice', $lang)) ?></label><select class="select" id="ts-voice"><option value=""><?= e(vv_t('text_to_speech.loading', $lang)) ?></option></select></div>
    <div class="stack-sm"><label class="field-label" for="ts-lang"><?= e(vv_t('text_to_speech.lang_filter', $lang)) ?></label><select class="select" id="ts-lang"><option value=""><?= e(vv_t('text_to_speech.all', $lang)) ?></option></select></div>
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ts-rate"><?= e(vv_t('text_to_speech.rate', $lang)) ?>: <span id="ts-rate-v">1.0</span>×</label>
    <input type="range" id="ts-rate" min="0.5" max="2" step="0.1" value="1" style="width:100%">
  </div>
  <div class="stack-sm">
    <label class="field-label" for="ts-pitch"><?= e(vv_t('text_to_speech.pitch', $lang)) ?>: <span id="ts-pitch-v">1.0</span>×</label>
    <input type="range" id="ts-pitch" min="0" max="2" step="0.1" value="1" style="width:100%">
  </div>
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <button class="btn btn-primary" id="ts-speak" type="button"><?= icon_svg('Volume2', 16) ?> <?= e(vv_t('text_to_speech.speak', $lang)) ?></button>
    <button class="btn btn-secondary" id="ts-pause" type="button"><?= e(vv_t('text_to_speech.pause', $lang)) ?></button>
    <button class="btn btn-ghost" id="ts-stop" type="button"><?= e(vv_t('tool_common.stop', $lang)) ?></button>
  </div>
  <p class="error-text hidden" id="ts-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('text_to_speech.footer', $lang)) ?></p>
</div>