<?php // Načti vendored marked + DOMPurify lokálně (žádný CDN). ?>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/safe-markdown.js"></script>
<div class="stack" style="max-width:60rem;margin:0 auto">
  <div class="row" style="flex-wrap:wrap;gap:0.5rem">
    <div class="row" style="gap:0.25rem;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" data-md="bold" type="button" title="<?= e(vv_t('markdown_editor.title_bold', $lang)) ?>"><strong>B</strong></button>
      <button class="btn btn-ghost btn-sm" data-md="italic" type="button" title="<?= e(vv_t('markdown_editor.title_italic', $lang)) ?>"><em>I</em></button>
      <button class="btn btn-ghost btn-sm" data-md="h1" type="button" title="<?= e(vv_t('markdown_editor.title_h1', $lang)) ?>">H1</button>
      <button class="btn btn-ghost btn-sm" data-md="h2" type="button" title="<?= e(vv_t('markdown_editor.title_h2', $lang)) ?>">H2</button>
      <button class="btn btn-ghost btn-sm" data-md="quote" type="button" title="<?= e(vv_t('markdown_editor.title_quote', $lang)) ?>">“</button>
      <button class="btn btn-ghost btn-sm" data-md="code" type="button" title="<?= e(vv_t('markdown_editor.title_code', $lang)) ?>">{ }</button>
      <button class="btn btn-ghost btn-sm" data-md="link" type="button" title="<?= e(vv_t('markdown_editor.title_link', $lang)) ?>">🔗</button>
      <button class="btn btn-ghost btn-sm" data-md="list" type="button" title="<?= e(vv_t('markdown_editor.title_list', $lang)) ?>">•</button>
    </div>
    <div class="grow"></div>
    <div class="row" style="gap:0.25rem">
      <button class="btn btn-ghost btn-sm" id="md-export-md" type="button"><?= icon_svg('Download', 16) ?> .md</button>
      <button class="btn btn-ghost btn-sm" id="md-export-html" type="button"><?= icon_svg('Download', 16) ?> .html</button>
      <button class="btn btn-ghost btn-sm" id="md-clear" type="button"><?= icon_svg('Trash', 16) ?></button>
    </div>
  </div>

  <div class="split-2">
    <div class="stack-sm">
      <span class="muted" style="font-size:0.75rem;font-weight:500">Markdown</span>
      <textarea class="textarea input-mono" id="md-input" placeholder="<?= e(vv_t('markdown_editor.placeholder', $lang)) ?>" spellcheck="false"></textarea>
    </div>
    <div class="stack-sm">
      <span class="muted" style="font-size:0.75rem;font-weight:500"><?= e(vv_t('markdown_editor.preview', $lang)) ?></span>
      <div class="preview markdown-body" id="md-preview" aria-live="polite"></div>
    </div>
  </div>

  <p class="muted" style="font-size:0.8rem"><?= e(vv_t('markdown_editor.note', $lang)) ?></p>
</div>
