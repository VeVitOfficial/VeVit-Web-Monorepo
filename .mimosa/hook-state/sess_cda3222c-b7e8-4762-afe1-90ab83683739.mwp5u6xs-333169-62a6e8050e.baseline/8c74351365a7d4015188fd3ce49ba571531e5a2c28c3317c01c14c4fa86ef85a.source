// Engine: prompt_builder
window.Engines = window.Engines || {};
Engines.prompt_builder = {
  render(config, container) {
    const blocks = config.blocks || [];
    let slots = [];
    container.innerHTML = "";
    const pool = el("div", { class: "pb-pool" });
    const slotsWrap = el("div", { class: "pb-slots" });
    function paint() {
      pool.innerHTML = "";
      blocks.forEach((b) => {
        if (slots.includes(b.id)) return;
        const node = el("div", { class: "pb-block" });
        node.innerHTML = `${escapeHTML(b.label)} <span style="color:var(--text-muted)">+</span>`;
        node.addEventListener("click", () => { if (container.dataset.locked) return; slots.push(b.id); paint(); });
        pool.appendChild(node);
      });
      slotsWrap.innerHTML = "";
      slots.forEach((id, i) => {
        const b = blocks.find((x) => x.id === id);
        const node = el("div", { class: "pb-block pb-slot" });
        node.innerHTML = `<span style="color:var(--primary)">${i + 1}.</span> ${escapeHTML(b.label)} <span class="x">✕</span>`;
        node.addEventListener("click", () => { if (container.dataset.locked) return; slots.splice(i, 1); paint(); });
        slotsWrap.appendChild(node);
      });
      if (!slots.length) slotsWrap.textContent = "Přidej bloky z poolu výše…";
    }
    paint();
    container.appendChild(el("div", {}, [el("div", { style: "font-size:.8rem;color:var(--text-secondary);margin-bottom:.4rem" }, "Dostupné bloky:"), pool]));
    container.appendChild(el("div", { style: "margin-top:.75rem" }, [el("div", { style: "font-size:.8rem;color:var(--text-secondary);margin-bottom:.4rem" }, "Sestavený prompt (klik pro odebrání):"), slotsWrap]));
    return {
      getAnswer() { return { order: [...slots] }; },
      onResult(r) {
        container.dataset.locked = "1";
        const correct = r.correct_answer && r.correct_answer.order ? r.correct_answer.order : (config.correctStructure || []);
        const ok = correct.length === slots.length && correct.every((c, i) => String(c) === String(slots[i]));
        slotsWrap.style.borderColor = ok ? "var(--success)" : "var(--error)";
      },
      destroy() {},
    };
  },
};
