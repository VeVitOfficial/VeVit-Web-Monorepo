// Engine: multiple_choice / true_false
window.Engines = window.Engines || {};
Engines.multiple_choice = {
  render(config, container) {
    const opts = config.options || [];
    const allowMultiple = !!config.allowMultiple;
    let selected = new Set();
    container.innerHTML = "";
    opts.forEach((o, i) => {
      const b = el("button", { class: "option", "data-id": o.id != null ? o.id : i });
      b.innerHTML = `<span class="marker"></span><span>${escapeHTML(o.text)}</span>`;
      b.addEventListener("click", () => {
        if (container.dataset.locked) return;
        if (allowMultiple) { selected.has(o.id) ? selected.delete(o.id) : selected.add(o.id); b.classList.toggle("selected"); }
        else { selected = new Set([o.id]); qsa(".option", container).forEach((x) => x.classList.remove("selected")); b.classList.add("selected"); }
      });
      container.appendChild(b);
    });
    return {
      getAnswer() { return { selectedIds: [...selected] }; },
      onResult(r) {
        container.dataset.locked = "1";
        const correct = r.correct_answer && r.correct_answer.correctIds ? r.correct_answer.correctIds : [];
        qsa(".option", container).forEach((b) => {
          const id = b.dataset.id;
          const mk = b.querySelector(".marker");
          if (correct.includes(id) || correct.includes(Number(id))) { b.classList.add("correct"); if (mk) mk.classList.add("on"); }
          else if (b.classList.contains("selected")) b.classList.add("wrong");
          b.disabled = true;
        });
      },
      destroy() {},
    };
  },
};
Engines.true_false = {
  render(config, container) {
    return Engines.multiple_choice.render({ question: config.question, options: [{ id: "true", text: config.trueLabel || "Pravda" }, { id: "false", text: config.falseLabel || "Nepravda" }], allowMultiple: false, correctIds: config.correctIds }, container);
  },
};
