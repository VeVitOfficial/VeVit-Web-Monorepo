// Globální pomocné funkce dostupné přes window.vevit (pro inline onclick v renderovaném HTML)

import { icon, renderIcons } from "./dom.js";

const v = (window.vevit = window.vevit || {});

// Kopírování kódu z CodeBlocku – btn leží v hlavičce, kód v vedlejším <pre><code>
v.copyCode = function (btn) {
  const pre = btn.closest(".code-block")?.querySelector("code");
  if (!pre) return;
  const text = pre.textContent;
  navigator.clipboard?.writeText(text).then(
    () => {
      btn.innerHTML = icon("check", "h-3.5 w-3.5");
      renderIcons(btn);
      setTimeout(() => {
        btn.innerHTML = icon("copy", "h-3.5 w-3.5");
        renderIcons(btn);
      }, 2000);
    },
    () => {}
  );
};

// Escaping pro vkládání textu do HTML (k dispozici i pro inline handlery)
v.escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
