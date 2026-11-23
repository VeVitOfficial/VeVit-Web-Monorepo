(function initSandboxRunner(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.VeVitSandboxRunner = api;
})(typeof window !== "undefined" ? window : globalThis, function sandboxRunnerFactory() {
  "use strict";

  const RESULT_KEYS = ["error", "logs", "nonce", "type"];

  function normalizeSandboxLogs(values) {
    return Array.isArray(values) ? values.map((value) => String(value)) : [];
  }

  function hasExactKeys(value, expected) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Object.keys(value).sort().join("\0") === expected.join("\0");
  }

  function isSandboxResultMessage(event, frameWindow, nonce) {
    if (!event || event.origin !== "null" || event.source !== frameWindow) return false;
    const data = event.data;
    if (!hasExactKeys(data, RESULT_KEYS)) return false;
    if (data.type !== "vevit-sandbox-result" || data.nonce !== nonce) return false;
    if (!Array.isArray(data.logs) || data.logs.some((line) => typeof line !== "string")) return false;
    return data.error === null || typeof data.error === "string";
  }

  function createNonce() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  function run(code, options) {
    const settings = options || {};
    const timeoutMs = Number.isFinite(settings.timeoutMs) ? settings.timeoutMs : 3000;
    const frameUrl = settings.frameUrl || "/edu/sandbox-frame.html";

    return new Promise((resolve) => {
      const iframe = document.createElement("iframe");
      const nonce = createNonce();
      const startedAt = performance.now();
      const listenerController = new AbortController();
      let finished = false;

      iframe.hidden = true;
      iframe.setAttribute("sandbox", "allow-scripts");
      iframe.setAttribute("aria-hidden", "true");
      iframe.src = frameUrl;

      function finish(result) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        listenerController.abort();
        iframe.remove();
        resolve({
          output: normalizeSandboxLogs(result.logs),
          error: result.error,
          duration: Math.round(performance.now() - startedAt),
        });
      }

      window.addEventListener("message", (event) => {
        if (!isSandboxResultMessage(event, iframe.contentWindow, nonce)) return;
        finish(event.data);
      }, { signal: listenerController.signal });

      iframe.addEventListener("load", () => {
        // Opaque sandbox má origin "null", proto zde nelze použít přesnější targetOrigin.
        iframe.contentWindow.postMessage({ type: "vevit-sandbox-run", nonce, code: String(code) }, "*");
      }, { once: true, signal: listenerController.signal });

      const timer = setTimeout(() => {
        finish({ logs: [], error: "Timeout: Kód běžel déle než 3 sekundy." });
      }, timeoutMs);

      document.body.appendChild(iframe);
    });
  }

  return { isSandboxResultMessage, normalizeSandboxLogs, run };
});
