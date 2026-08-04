<div class="stack" style="max-width:46rem;margin:0 auto">
  <div class="ai-head"><span class="badge badge-ai">AI</span><span class="muted" style="font-size:0.875rem">Model: <?= e(ollama_model()) ?></span></div>
  <div class="stack-sm"><label class="field-label" for="sql-dialect">Dialekt</label>
    <select class="select" id="sql-dialect"><option value="PostgreSQL" selected>PostgreSQL</option><option value="MySQL">MySQL</option><option value="SQLite">SQLite</option><option value="MSSQL (T-SQL)">MSSQL (T-SQL)</option></select></div>
  <textarea class="textarea" id="sql-input" rows="8" placeholder="Popište, co má dotaz dělat (např. „top 10 zákazníků podle počtu objednávek za letošek")…"></textarea>
  <button class="btn btn-primary btn-touch" id="sql-run" type="button"><?= icon_svg('Database', 18) ?> <span class="sql-label">Vygenerovat SQL</span><span class="sql-stop hidden">Zastavit</span></button>
  <div class="ai-error hidden" id="sql-error"><span class="ai-error-icon"><?= icon_svg('AlertCircle', 16) ?></span><span id="sql-error-text"></span></div>
  <div class="result-card hidden" id="sql-out">
    <div class="markdown-body" id="sql-md"></div>
    <div class="row" style="gap:0.5rem;margin-top:0.75rem"><button class="btn btn-secondary btn-sm" id="sql-copy" type="button"><?= icon_svg('Copy', 14) ?> Kopírovat</button></div>
  </div>
  <p class="muted" style="font-size:0.8rem">Vygeneruje SQL pro zadaný dialekt. Vždy si výstup zkontrolujte před spuštěním na produkční databázi. Běží lokálně přes Ollamu. Vstup max 20 000 znaků.</p>
</div>
<script src="/tools/assets/js/lib/marked.min.js"></script>
<script src="/tools/assets/js/lib/purify.min.js"></script>
<script src="/tools/assets/js/lib/ai-tool.js"></script>