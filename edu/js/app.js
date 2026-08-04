// Entry point – inicializace theme/lang/progress + router

import "./lib/globals.js";
import { initTheme } from "./store/theme.js";
import { initLang, currentLang } from "./store/lang.js";
import { initRouter, rerender } from "./router.js";

function boot() {
  initTheme();
  initLang();

  // Re-render při změně jazyka
  window.addEventListener("vevit:langchange", rerender);

  initRouter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
