// Engine: matching (klik: levý → pravý)
window.Engines = window.Engines || {};
Engines.matching = {
  render(config, container) {
    const pairs = config.pairs || [];
    const leftOrder = shuffle(pairs.map((p) => p.id));
    const rightOrder = shuffle(pairs.map((p) => p.id));
    const matches = new Map(); // leftId -> rightId
    let selLeft = null;
    container.innerHTML = "";
    const wrap = el("div", { class: "match-cols" });
    const leftCol = el("div", { style: "display:flex;flex-direction:column;gap:.5rem" });
    const rightCol = el("div", { style: "display:flex;flex-direction:column;gap:.5rem" });

    function paint() {
      leftCol.innerHTML = ""; rightCol.innerHTML = "";
      leftOrder.forEach((lid) => {
        const p = pairs.find((x) => x.id === lid);
        const matched = matches.has(lid);
        const card = el("div", { class: "match-card" + (selLeft === lid ? " sel" : matched ? " paired" : ""), "data-left": lid });
        card.textContent = p.left + (matched ? "  ↔  " + (pairs.find((x) => x.id === matches.get(lid)) || {}).right : "");
        card.addEventListener("click", () => {
          if (container.dataset.locked) return;
          if (matched) { matches.delete(lid); selLeft = null; paint(); return; }
          selLeft = lid; paint();
        });
        leftCol.appendChild(card);
      });
      rightOrder.forEach((rid) => {
        const p = pairs.find((x) => x.id === rid);
        const used = [...matches.values()].includes(rid);
        const card = el("div", { class: "match-card" + (used ? " paired" : ""), "data-right": rid });
        card.textContent = p.right;
        card.addEventListener("click", () => {
          if (container.dataset.locked || used) return;
          if (selLeft === null) return;
          matches.set(selLeft, rid); selLeft = null; paint();
        });
        rightCol.appendChild(card);
      });
    }
    wrap.appendChild(leftCol); wrap.appendChild(rightCol);
    container.appendChild(wrap);
    paint();
    return {
      getAnswer() { return { pairs: [...matches.entries()].map(([l, r]) => ({ leftId: l, rightId: r })) }; },
      onResult(r) {
        container.dataset.locked = "1";
        const correct = r.correct_answer && r.correct_answer.pairs ? r.correct_answer.pairs : (config.correctPairs || pairs.map((p) => ({ leftId: p.id, rightId: p.id })));
        const ok = (a, b) => correct.some((c) => String(c.leftId) === String(a) && String(c.rightId) === String(b));
        qsa("[data-left]", container).forEach((c) => {
          const lid = c.dataset.left;
          if (matches.has(lid)) {
            const good = ok(lid, matches.get(lid));
            c.style.borderColor = good ? "var(--success)" : "var(--error)";
          }
        });
      },
      destroy() {},
    };
  },
};
