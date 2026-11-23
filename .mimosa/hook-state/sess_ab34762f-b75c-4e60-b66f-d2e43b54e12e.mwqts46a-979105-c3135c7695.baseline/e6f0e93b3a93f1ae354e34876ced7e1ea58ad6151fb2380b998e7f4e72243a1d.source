// Engine: sorting
window.Engines = window.Engines || {};
Engines.sorting = {
  render(config, container) {
    let items = (config.items || []).map((it) => ({ id: it.id, text: it.text }));
    container.innerHTML = "";
    function paint() {
      container.innerHTML = "";
      items.forEach((it, idx) => {
        const row = el("div", { class: "sort-item" });
        row.innerHTML = `<span class="handle">☰</span><span style="flex:1">${escapeHTML(it.text)}</span><div class="arr-btns"><button data-d="-1" ${idx === 0 ? "disabled" : ""}>▲</button><button data-d="1" ${idx === items.length - 1 ? "disabled" : ""}>▼</button></div>`;
        qsa("button", row).forEach((b) => b.addEventListener("click", () => {
          if (container.dataset.locked) return;
          const d = Number(b.dataset.d), n = idx + d;
          if (n < 0 || n >= items.length) return;
          [items[idx], items[n]] = [items[n], items[idx]]; paint();
        }));
        container.appendChild(row);
      });
    }
    paint();
    return {
      getAnswer() { return { order: items.map((i) => i.id) }; },
      onResult(r) {
        container.dataset.locked = "1";
        const correct = r.correct_answer && r.correct_answer.order ? r.correct_answer.order : (config.correctOrder || []);
        qsa(".sort-item", container).forEach((row, i) => {
          const ok = String(items[i].id) === String(correct[i]);
          row.style.borderColor = ok ? "var(--success)" : "var(--error)";
          row.style.background = ok ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)";
        });
      },
      destroy() {},
    };
  },
};
