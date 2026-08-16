<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="vc-drop">
    <span class="dz-ico"><?= icon_svg('Video', 28) ?></span>
    <span class="dz-title">Přetáhněte video</span>
    <span class="dz-hint">MP4, WebM, MOV, MKV… — převod přes ffmpeg.wasm</span>
  </div>
  <div class="file-list hidden" id="vc-list"></div>
  <div class="hidden" id="vc-work">
    <div class="stack-sm"><label class="field-label" for="vc-format">Cílový formát</label>
      <select class="select" id="vc-format"><option value="mp4">MP4 (H.264/AAC)</option><option value="webm">WebM (VP8/Vorbis)</option></select></div>
    <button class="btn btn-primary btn-touch" id="vc-run" type="button" disabled><?= icon_svg('Video', 18) ?> Převést</button>
  </div>
  <div class="progress-track hidden" id="vc-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="vc-prog-label"></p>
  <p class="error-text hidden" id="vc-error" role="alert"></p>
  <p class="muted" style="font-size:0.8rem">Převod přes ffmpeg.wasm (běží v prohlížeči). WASM je pomalejší než nativní ffmpeg; u velkých souborů limit ~100 MB. Video neopustí prohlížeč.</p>
</div>