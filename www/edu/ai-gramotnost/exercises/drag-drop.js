// Engine: drag_drop (HTML5 DnD + click fallback pro mobil)
window.Engines = window.Engines || {};
Engines.drag_drop = {
  render(config, container) {
    const items = config.items || [];
    const zones = config.zones || [];
    const placement = new Map(); // itemId -> zoneId
    let selItem = null;
    container.innerHTML = "";
    const pool = el("div", { class: "dd-zone", "data-zone": "__pool__" });
    pool.textContent = items.length ? "" : "—";
    const zonesWrap = el("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.75rem;margin-top:.75rem" });

    function makeItem(it) {
      const node = el("div", { class: "dd-item", draggable: "true", "data-item": it.id });
      node.textContent = it.text;
      node.addEventListener("click", () => { if (container.dataset.locked) return; selItem = it.id; qsa(".dd-item", container).forEach((x) => x.classList.remove("sel")); node.classList.add("sel"); });
      node.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", it.id); node.classList.add("dragging"); });
      node.addEventListener("dragend", () => node.classList.remove("dragging"));
      return node;
    }
    function place(itemId, zoneId) {
      placement.set(itemId, zoneId);
      render();
    }
    function render() {
      pool.innerHTML = "";
      const inPool = items.filter((it) => !placement.has(it.id));
      if (!inPool.length) pool.textContent = "Vše umístěno";
      inPool.forEach((it) => pool.appendChild(makeItem(it)));
      zonesWrap.innerHTML = "";
      zones.forEach((z) => {
        const zone = el("div", {});
        zone.innerHTML = `<div style="font-size:.8rem;color:var(--text-secondary);margin-bottom:.4rem">${escapeHTML(z.label)}</div>`;
        const drop = el("div", { class: "dd-zone", "data-zone": z.id });
        items.filter((it) => placement.get(it.id) === z.id).forEach((it) => drop.appendChild(makeItem(it)));
        drop.addEventListener("click", (e) => { if (container.dataset.locked || !selItem) return; if (e.target === drop || e.target.classList.contains("dd-zone")) { place(selItem, z.id); selItem = null; } });
        drop.addEventListener("dragover", (e) => { e.preventDefault(); drop.classList.add("over"); });
        drop.addEventListener("dragleave", () => drop.classList.remove("over"));
        drop.addEventListener("drop", (e) => { e.preventDefault(); drop.classList.remove("over"); const id = e.dataTransfer.getData("text/plain"); if (id) place(id, z.id); });
        zone.appendChild(drop);
        zonesWrap.appendChild(zone);
      });
    }
    pool.addEventListener("dragover", (e) => { e.preventDefault(); pool.classList.add("over"); });
    pool.addEventListener("dragleave", () => pool.classList.remove("over"));
    pool.addEventListener("drop", (e) => { e.preventDefault(); pool.classList.remove("over"); const id = e.dataTransfer.getData("text/plain"); if (id) placement.delete(id) || place(id, "__pool__"); if (id) { placement.delete(id); render(); } });
    container.appendChild(el("div", {}, [el("div", { style: "font-size:.8rem;color:var(--text-secondary);margin-bottom:.4rem" }, "Pool (přetáhni do zón nebo klikni položku a pak zónu)"), pool]));
    container.appendChild(zonesWrap);
    render();
    return {
      getAnswer() { return { placements: Object.fromEntries(placement) }; },
      onResult(r) {
        container.dataset.locked = "1";
        const correct = r.correct_answer && r.correct_answer.placements ? r.correct_answer.placements : (config.correctPlacements || {});
        items.forEach((it) => {
          const ok = placement.get(it.id) === correct[it.id];
          qsa(`[data-item="${it.id}"]`, container).forEach((n) => { n.style.borderColor = ok ? "var(--success)" : "var(--error)"; n.draggable = false; });
        });
      },
      destroy() {},
    };
  },
};
