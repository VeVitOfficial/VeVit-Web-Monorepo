// Pomocné funkce pro DOM, ikony a toasty

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// PascalCase (lucide-react) → kebab-case (lucide data-lucide)
export function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .toLowerCase();
}

// Vrátí HTML řetězec pro lucide ikonu. name může být PascalCase i kebab.
export function icon(name, cls = "h-4 w-4") {
  const kebab = name.includes("-") ? name : toKebab(name);
  return `<i data-lucide="${kebab}" class="${cls}"></i>`;
}

// Inicializuje všechny [data-lucide] v daném rootu (volat po každém renderu).
export function renderIcons(root = document) {
  if (window.lucide && window.lucide.createIcons) {
    window.lucide.createIcons({ root, attrs: {} });
  }
}

// Vytvoří element z HTML řetězce
export function fromHTML(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// Toast
export function toast(message, type = "info") {
  const container = $("#toast-container");
  if (!container) return;
  const color =
    type === "success" ? "border-success/40" : type === "error" ? "border-error/40" : "";
  const el = fromHTML(`<div class="toast ${color} fade-in">${escapeHtml(message)}</div>`);
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// Escaping pro vkládání uživatelského textu do HTML
export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Zjednodušený hyperscript (zřídka používaný)
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}