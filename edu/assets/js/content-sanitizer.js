(function initContentSanitizer(root) {
  "use strict";

  const COMMON_TAGS = [
    "p", "br", "hr", "div", "span", "section", "article", "h1", "h2", "h3", "h4", "h5", "h6",
    "strong", "b", "em", "i", "u", "s", "small", "sub", "sup", "blockquote", "pre", "code", "kbd", "var",
    "ul", "ol", "li", "dl", "dt", "dd", "figure", "figcaption", "table", "caption", "thead", "tbody", "tfoot",
    "tr", "th", "td", "a", "img",
  ];
  const COMMON_ATTR = ["id", "class", "title", "lang", "dir", "href", "src", "alt", "width", "height", "colspan", "rowspan", "scope", "loading"];
  const SAFE_URI = /^(?:(?:https?):|(?:\.?\/)|#)/i;

  function purifier() {
    if (!root.DOMPurify || root.DOMPurify.isSupported !== true || typeof root.DOMPurify.sanitize !== "function") {
      throw new Error("Bezpečný renderer není dostupný.");
    }
    return root.DOMPurify;
  }

  function config(extra) {
    return Object.assign({
      ALLOWED_TAGS: COMMON_TAGS,
      ALLOWED_ATTR: COMMON_ATTR,
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "svg", "math", "form", "input", "button", "template", "noscript"],
      FORBID_ATTR: ["style", "srcdoc", "srcset"],
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false,
      ALLOWED_URI_REGEXP: SAFE_URI,
      SAFE_FOR_TEMPLATES: true,
    }, extra || {});
  }

  function sanitizeLesson(html) {
    return purifier().sanitize(String(html || ""), config());
  }

  function sanitizeWikipedia(html) {
    return purifier().sanitize(String(html || ""), config({ RETURN_DOM: true }));
  }

  root.VeVitContentSanitizer = { sanitizeLesson, sanitizeWikipedia };
})(window);
