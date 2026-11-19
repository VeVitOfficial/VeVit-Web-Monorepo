// Jediný renderer markdown/AI HTML v Tools. Při chybě závislostí selže uzavřeně.
(function initSafeMarkdown(root) {
  'use strict';

  var CONFIG = Object.freeze({
    ALLOWED_TAGS: ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 's', 'del', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input', 'button', 'template', 'noscript'],
    FORBID_ATTR: ['style', 'srcdoc', 'src', 'srcset'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
    SAFE_FOR_TEMPLATES: true
  });

  function dependencies() {
    if (!root.marked || typeof root.marked.parse !== 'function') throw new Error('Markdown parser není dostupný.');
    if (!root.DOMPurify || root.DOMPurify.isSupported !== true || typeof root.DOMPurify.sanitize !== 'function') {
      throw new Error('HTML sanitizer není dostupný.');
    }
    return { marked: root.marked, purifier: root.DOMPurify };
  }

  function toSafeHtml(markdown) {
    var deps = dependencies();
    var raw = deps.marked.parse(String(markdown || ''), { async: false });
    return deps.purifier.sanitize(raw, CONFIG);
  }

  function renderInto(element, markdown) {
    if (!element) return false;
    try {
      element.innerHTML = toSafeHtml(markdown);
      element.dataset.renderState = 'ready';
      return true;
    } catch (error) {
      element.replaceChildren(document.createTextNode('Náhled nelze bezpečně vykreslit.'));
      element.dataset.renderState = 'error';
      return false;
    }
  }

  root.VeVitMarkdown = { renderInto: renderInto, toSafeHtml: toSafeHtml };
})(window);
