<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="dropzone" id="ps-drop">
    <span class="dz-ico"><?= icon_svg('Upload', 28) ?></span>
    <span class="dz-title"><?= e(vv_t('pdf_split.drop_title', $lang)) ?></span>
    <span class="dz-hint"><?= e(vv_t('tool_common.click_choose', $lang)) ?></span>
    <span class="dz-accept"><?= e(vv_t('pdf_split.drop_accept', $lang)) ?></span>
  </div>

  <div class="file-list hidden" id="ps-list" aria-label="<?= e(vv_t('pdf_split.selected_file', $lang)) ?>"></div>

  <div class="stack-sm">
    <span class="field-label"><?= e(vv_t('pdf_split.mode_label', $lang)) ?></span>
    <div class="seg" id="ps-mode" role="tablist">
      <button type="button" class="active" data-mode="each" role="tab" aria-selected="true"><?= e(vv_t('pdf_split.mode_each', $lang)) ?></button>
      <button type="button" data-mode="chunk" role="tab" aria-selected="false"><?= e(vv_t('pdf_split.mode_chunk', $lang)) ?></button>
      <button type="button" data-mode="ranges" role="tab" aria-selected="false"><?= e(vv_t('pdf_split.mode_ranges', $lang)) ?></button>
    </div>
  </div>

  <div class="stack-sm hidden" id="ps-chunk-opt">
    <label class="field-label" for="ps-n"><?= e(vv_t('pdf_split.chunk_label', $lang)) ?></label>
    <input class="input" type="number" id="ps-n" min="1" value="1" style="width:8rem" inputmode="numeric">
  </div>
  <div class="stack-sm hidden" id="ps-ranges-opt">
    <label class="field-label" for="ps-ranges"><?= e(vv_t('pdf_split.ranges_label', $lang)) ?></label>
    <input class="input" type="text" id="ps-ranges" placeholder="1-3, 4, 5-8" style="width:100%">
  </div>

  <div class="row" style="flex-wrap:wrap">
    <button class="btn btn-primary btn-touch" id="ps-run" type="button" disabled><?= icon_svg('Scissors', 18) ?> <?= e(vv_t('pdf_split.run', $lang)) ?></button>
    <button class="btn btn-ghost" id="ps-clear" type="button" disabled><?= icon_svg('Trash', 16) ?> <?= e(vv_t('tool_common.clear', $lang)) ?></button>
  </div>

  <div class="progress-track hidden" id="ps-prog"><div class="progress-fill"></div></div>
  <p class="progress-label hidden" id="ps-prog-label"></p>
  <p class="error-text hidden" id="ps-error" role="alert"></p>

  <div class="result-card hidden" id="ps-result">
    <span class="rc-ico"><?= icon_svg('FileText', 24) ?></span>
    <div class="rc-meta">
      <span class="rc-title">pdf-split.zip</span>
      <span class="rc-sub" id="ps-result-sub"></span>
    </div>
    <button class="btn btn-primary" id="ps-download" type="button"><?= icon_svg('Download', 16) ?> <?= e(vv_t('tool_common.download', $lang)) ?> ZIP</button>
  </div>

  <div class="privacy-note"><?= icon_svg('ShieldCheck', 16) ?> <?= e(vv_t('pdf_split.privacy', $lang)) ?></div>
</div>