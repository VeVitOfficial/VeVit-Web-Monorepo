// Entry point – inicializace theme/lang/progress + router

import "./lib/globals.js";
import { initTheme } from "./store/theme.js";
import { initLang, currentLang } from "./store/lang.js";
import { initRouter, rerender } from "./router.js?v=20260809e";

function boot() {
  initTheme();
  initLang();

  // Re-render při změně jazyka
  window.addEventListener("vevit:langchange", rerender);
  window.addEventListener("vevit:localechange", (event) => {
    const locale = event.detail?.locale;
    if (locale && locale !== currentLang()) changeLang(locale);
  });

  initRouter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
