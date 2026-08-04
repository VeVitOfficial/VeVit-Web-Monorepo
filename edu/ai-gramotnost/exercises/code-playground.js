// Engine: code_playground
window.Engines = window.Engines || {};
Engines.code_playground = {
  render(config, container) {
    let code = config.starterCode || "";
    container.innerHTML = "";
    const area = el("textarea", { class: "cp-area", spellcheck: "false" });
    area.value = code;
    area.addEventListener("input", () => (code = area.value));
    const out = el("div", { class: "cp-out" });
    out.textContent = "// výstup se zobrazí po spuštění";
    const run = el("button", { class: "btn btn-ghost", style: "margin-top:.6rem" }, "Spustit (JS)");
    run.addEventListener("click", () => {
      if (config.language && !["javascript", "js"].includes(String(config.language).toLowerCase())) { out.textContent = "Spuštění je podporováno pro JavaScript. Pro ostatní jazyky použij „Zkontrolovat“."; return; }
      const logs = [];
      try {
        const sandbox = new Function("console", code);
        sandbox({ log: (...a) => logs.push(a.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ")), error: (...a) => logs.push("[ERROR] " + a.join(" ")), warn: (...a) => logs.push("[WARN] " + a.join(" ")) });
        out.textContent = logs.join("\n") || "(bez výstupu)";
      } catch (e) { out.textContent = "[ERROR] " + e.message; }
    });
    container.appendChild(el("div", { class: "cp-editor" }, [area, run, out]));
    return {
      getAnswer() { return { code }; },
      onResult(r) {
        out.textContent = r.feedback || (r.is_correct ? "Správně!" : "Zkus to znovu.");
        out.style.color = r.is_correct ? "var(--success)" : "var(--error)";
      },
      destroy() {},
    };
  },
};
