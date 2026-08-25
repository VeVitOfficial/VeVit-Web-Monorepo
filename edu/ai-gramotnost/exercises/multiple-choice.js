// Engine: multiple_choice / true_false
window.Engines = window.Engines || {};
const AI_QUIZ_LETTERS = ["A", "B", "C", "D", "E", "F"];

Engines.multiple_choice = {
  render(config, container) {
    const opts = config.options || [];
    const allowMultiple = !!config.allowMultiple;
    let selected = new Set();
    container.innerHTML = "";
    opts.forEach((o, i) => {
      const optionId = o.id != null ? o.id : i;
      const b = el("button", { class: "ai-quiz-option", "data-id": optionId });
      b.innerHTML = `<span class="ai-quiz-option__marker">${AI_QUIZ_LETTERS[i] || String(i + 1)}</span><span class="ai-quiz-option__text">${escapeHTML(o.text)}</span>`;
      b.addEventListener("click", () => {
        if (container.dataset.locked) return;
        if (allowMultiple) {
          selected.has(optionId) ? selected.delete(optionId) : selected.add(optionId);
          b.classList.toggle("ai-quiz-option--selected");
        } else {
          selected = new Set([optionId]);
          qsa(".ai-quiz-option", container).forEach((x) => x.classList.remove("ai-quiz-option--selected"));
          b.classList.add("ai-quiz-option--selected");
        }
      });
      container.appendChild(b);
    });
    return {
      getAnswer() { return { selectedIds: [...selected] }; },
      onResult(r) {
        container.dataset.locked = "1";
        const correct = r.correct_answer && r.correct_answer.correctIds ? r.correct_answer.correctIds : [];
        qsa(".ai-quiz-option", container).forEach((b) => {
          const id = b.dataset.id;
          const mk = b.querySelector(".ai-quiz-option__marker");
          if (correct.includes(id) || correct.includes(Number(id))) {
            b.classList.add("ai-quiz-option--correct");
            if (mk) mk.innerHTML = icon("check", "icon");
          } else if (b.classList.contains("ai-quiz-option--selected")) {
            b.classList.add("ai-quiz-option--wrong");
            if (mk) mk.innerHTML = icon("x", "icon");
          }
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
