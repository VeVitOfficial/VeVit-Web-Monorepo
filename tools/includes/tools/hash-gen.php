<div class="stack" style="max-width:42rem;margin:0 auto">
  <div class="row" style="gap:0.5rem;margin-bottom:0.25rem">
    <span class="badge badge-loc-local"><?= e(vv_t('tool_common.local', $lang)) ?></span>
  </div>

  <textarea class="textarea input-mono" id="hash-input" placeholder="<?= e(vv_t('hash_gen.placeholder', $lang)) ?>" style="min-height:160px;background:rgba(19,19,22,0.5)"></textarea>

  <div class="row" style="gap:0.75rem">
    <select class="select" id="hash-type" style="width:12rem">
      <option value="md5">MD5</option>
      <option value="sha256" selected>SHA-256</option>
      <option value="sha512">SHA-512</option>
    </select>
    <button class="btn btn-primary" id="hash-compute"><?= icon_svg('Hash', 16) ?> <?= e(vv_t('tool_common.compute', $lang)) ?></button>
  </div>

  <div class="stack-sm hidden" id="hash-result-wrap">
    <span class="muted" style="font-size:0.875rem;font-weight:500"><?= e(vv_t('tool_common.result', $lang)) ?></span>
    <div class="row" style="gap:0.5rem">
      <input class="input input-mono" id="hash-result" readonly style="font-size:0.875rem;background:rgba(19,19,22,0.3)">
      <button class="btn btn-ghost btn-icon" id="hash-copy" disabled>
        <span class="ico ico-copy"><?= icon_svg('Copy', 18) ?></span>
        <span class="ico ico-check hidden"><?= icon_svg('Check', 18) ?></span>
      </button>
    </div>
  </div>
</div>