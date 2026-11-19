// Engine: fill_blank
window.Engines = window.Engines || {};
Engines.fill_blank = {
  render(config, container) {
    const parts = (config.text || "").split("___");
    const inputs = [];
    container.innerHTML = "";
    parts.forEach((part, i) => {
      container.appendChild(document.createTextNode(part));
      if (i < parts.length - 1) {
        const inp = el("input", { class: "input", style: "display:inline-block;width:auto;margin:0 .3rem;border-radius:6px;padding:.4rem .5rem", placeholder: "…" });
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { const n = inputs[i + 1]; if (n) n.focus(); } });
        inputs.push(inp);
        container.appendChild(inp);
      }
    });
    return {
      getAnswer() { return { values: inputs.map((i) => i.value) }; },
      onResult(r) {
        const correct = r.correct_answer && r.correct_answer.answers ? r.correct_answer.answers : (config.answers || []);
        inputs.forEach((inp, i) => {
          const ok = (inp.value || "").trim().toLowerCase() === String(correct[i] || "").trim().toLowerCase();
          inp.style.borderColor = ok ? "var(--success)" : "var(--error)";
          inp.style.background = ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)";
          inp.disabled = true;
        });
      },
      destroy() {},
    };
  },
};
