<div class="stack" style="max-width:44rem;margin:0 auto">
  <div class="dropzone" id="pc-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_compress.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('tool_common.click_choose', $lang)) ?></span>
    <span class="dz-accept"><?= e(vv_t('pdf_compress.drop_accept', $lang)) ?></span>
  </div>

  <div class="file-list hidden" id="pc-list" aria-label="<?= e(vv_t('pdf_compress.list_aria', $lang)) ?>"></div>

  <div class="stack-sm">
    <span class="field-label"><?= e(vv_t('pdf_compress.mode_label', $lang)) ?></span>
    <div class="seg" id="pc-mode" role="tablist">
      <button type="button" class="active" data-mode="lossless" role="tab" aria-selected="true"><?= e(vv_t('pdf_compress.mode_optimize', $lang)) ?></button>
      <button type="button" data-mode="raster" role="tab" aria-selected="false"><?= e(vv_t('pdf_compress.mode_raster', $lang)) ?></button>
    </div>
    <p class="muted" id="pc-mode-hint" style="font-size:0.8rem"><?= e(vv_t('pdf_compress.mode_hint', $lang)) ?></p>
  </div>

  <details class="accordion hidden" id="pc-raster-opt">
    <summary><?= e(vv_t('pdf_compress.raster_advanced', $lang)) ?> <span class="acc-chev"><?= icon_svg('ChevronDown', 16) ?></span></summary>
    <div class="acc-body">
      <div class="stack-sm">
        <div>
          <label class="field-label"><?= e(vv_t('pdf_compress.resolution', $lang)) ?> <span id="pc-dpi-val" class="mono">120</span> DPI</label>
          <div class="range-row"><input type="range" id="pc-dpi" min="72" max="200" step="6" value="120"><span class="range-val">72–200</span></div>
        </div>
        <div>
          <label class="field-label"><?= e(vv_t('pdf_compress.jpeg_quality', $lang)) ?> <span id="pc-q-val" class="mono">0,72</span></label>
          <div class="range-row"><input type="range" id="pc-q" min="0.4" max="0.95" step="0.01" value="0.72"><span class="range-val">0,4–0,95</span></div>
        </div>
        <p class="muted" style="font-size:0.78rem"><?= e(vv_t('pdf_compress.raster_note', $lang)) ?></p>
      </div>
    </div>
  </details>

  <div class="row" style="flex-wrap:wrap">
    <button class="btn btn-primary btn-touch" id="pc-run" type="button" disabled><?= icon_svg('Shrink', 18) ?> <?= e(vv_t('pdf_compress.compress', $lang)) ?></button>
    <button class="btn btn-ghost" id="pc-clear" type="button" disabled><?= icon_svg('Trash', 16) ?> <?= e(vv_t('tool_common.clear', $lang)) ?></button>
  </div>

  <div class="progress-track hidden" id="pc-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="pc-prog-label"></p>
  <p class="error-text hidden" id="pc-error" role="alert"></p>

  <div class="before-after hidden" id="pc-preview">
    <div class="ba-pane">
      <span class="ba-label"><?= e(vv_t('pdf_compress.original_page', $lang)) ?></span>
      <div class="ba-frame" id="pc-orig-frame"></div>
    </div>
    <div class="ba-pane">
      <span class="ba-label"><?= e(vv_t('pdf_compress.compressed_page', $lang)) ?></span>
      <div class="ba-frame" id="pc-new-frame"></div>
    </div>
  </div>

  <div class="result-card hidden" id="pc-result">
    <span class="rc-ico"><?= icon_svg('FileText', 24) ?></span>
    <div class="rc-meta">
      <span class="rc-title" id="pc-result-name"><?= e(vv_t('pdf_compress.result_name', $lang)) ?></span>
      <span class="rc-sub" id="pc-result-sub"></span>
    </div>
    <button class="btn btn-primary" id="pc-download" type="button"><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?></button>
  </div>

  <div class="privacy-note"><?= icon_svg('ShieldCheck', 16) ?> <?= e(vv_t('pdf_compress.privacy', $lang)) ?></div>
</div>