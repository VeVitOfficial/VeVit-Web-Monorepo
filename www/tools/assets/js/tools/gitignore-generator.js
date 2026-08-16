// .gitignore generátor — statické šablony, čistě client-side.
(function () {
  'use strict';
  var checks = ToolUI.el('gi-checks'), out = ToolUI.el('gi-out');
  var copyBtn = ToolUI.el('gi-copy'), clearBtn = ToolUI.el('gi-clear');

  var TEMPLATES = {
    'Node': ['node_modules/', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*', '.npm', '.yarn/', 'dist/', 'build/'],
    'Python': ['__pycache__/', '*.py[cod]', '*.egg-info/', '.venv/', 'venv/', '.pytest_cache/', '.mypy_cache/'],
    'PHP': ['vendor/', 'composer.lock', '.env'],
    'Java': ['target/', '*.class', '*.jar', '*.war', '.gradle/'],
    'Go': ['*.exe', '*.exe~', '*.dll', '*.so', '*.dylib', 'bin/'],
    'Rust': ['target/', '*.pdb', 'Cargo.lock'],
    'Composer': ['vendor/', 'composer.lock'],
    'Docker': ['*.pid', '.docker/'],
    'macOS': ['.DS_Store', '._*', '.AppleDouble', '.LSOverride'],
    'Windows': ['Thumbs.db', 'ehthumbs.db', 'Desktop.ini', '$RECYCLE.BIN/'],
    'Linux': ['*~', '.directory', '.Trash-*'],
    'JetBrains': ['.idea/', '*.iml', '*.ipr', '*.iws'],
    'VSCode': ['.vscode/*', '!.vscode/settings.json'],
    'Env soubory': ['.env', '.env.local', '*.secret']
  };
  var KEYS = Object.keys(TEMPLATES);
  var selected = {};

  function build() {
    var lines = [];
    var chosen = KEYS.filter(function (k) { return selected[k]; });
    chosen.forEach(function (k) {
      lines.push('# ' + k);
      TEMPLATES[k].forEach(function (p) { lines.push(p); });
      lines.push('');
    });
    out.value = lines.join('\n');
    copyBtn.disabled = !out.value;
  }

  KEYS.forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-ghost';
    b.textContent = k;
    b.addEventListener('click', function () {
      selected[k] = !selected[k];
      b.classList.toggle('btn-primary', selected[k]);
      b.classList.toggle('btn-ghost', !selected[k]);
      build();
    });
    checks.appendChild(b);
  });

  copyBtn.addEventListener('click', function () {
    if (!out.value) return;
    navigator.clipboard.writeText(out.value).then(function () { if (window.toast) toast.success('Zkopírováno'); });
  });
  clearBtn.addEventListener('click', function () {
    KEYS.forEach(function (k) { selected[k] = false; });
    Array.prototype.forEach.call(checks.children, function (b) { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); });
    build();
  });
})();