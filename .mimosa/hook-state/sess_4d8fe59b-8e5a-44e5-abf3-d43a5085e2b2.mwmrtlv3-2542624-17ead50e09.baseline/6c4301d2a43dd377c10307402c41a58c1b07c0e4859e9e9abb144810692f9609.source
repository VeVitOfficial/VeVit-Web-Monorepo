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
    run.addEventListener("click", async () => {
      if (config.language && !["javascript", "js"].includes(String(config.language).toLowerCase())) { out.textContent = "Spuštění je podporováno pro JavaScript. Pro ostatní jazyky použij „Zkontrolovat“."; return; }
      run.disabled = true;
      out.textContent = "Spouštění…";
      const result = await window.VeVitSandboxRunner.run(code);
      out.textContent = result.error ? `[ERROR] ${result.error}` : (result.output.join("\n") || "(bez výstupu)");
      run.disabled = false;
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
