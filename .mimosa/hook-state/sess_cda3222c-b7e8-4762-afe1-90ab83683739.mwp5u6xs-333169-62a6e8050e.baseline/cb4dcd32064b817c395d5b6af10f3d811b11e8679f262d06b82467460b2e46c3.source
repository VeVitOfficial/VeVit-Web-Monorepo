// Theme store – port ThemeProvider.tsx

const KEY = "vevit-theme";

export function getTheme() {
  return localStorage.getItem(KEY) === "light" ? "light" : "dark";
}

export function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  localStorage.setItem(KEY, theme);
}

export function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function initTheme() {
  applyTheme(getTheme());
}