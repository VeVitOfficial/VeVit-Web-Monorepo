// Engine: simulation (AI chat s pattern matching)
window.Engines = window.Engines || {};
Engines.simulation = {
  render(config, container) {
    const responses = config.responses || [];
    let turns = 0;
    let won = false;
    const transcript = [];
    container.innerHTML = "";
    const chat = el("div", { class: "chat" });
    const aiHello = config.scenario ? `Scénář: ${config.scenario}` : "Simulace začala.";
    transcript.push({ role: "ai", text: aiHello });
    chat.appendChild(el("div", { class: "bubble ai" }, aiHello));
    if (config.goal) chat.appendChild(el("div", { class: "bubble ai" }, `Cíl: ${config.goal}`));
    const input = el("input", { class: "input", placeholder: "Napiš zprávu…" });
    const send = el("button", { class: "btn btn-primary" }, "Odeslat");
    function reply(text) {
      const low = text.toLowerCase();
      let match = responses.find((r) => {
        if (!r.trigger) return false;
        if (r.trigger instanceof RegExp) return r.trigger.test(low);
        if (typeof r.trigger === "string" && r.trigger.startsWith("/") && r.trigger.endsWith("/")) { try { return new RegExp(r.trigger.slice(1, -1), "i").test(low); } catch { return false; } }
        return low.includes(String(r.trigger).toLowerCase());
      });
      const aiText = match ? match.response : (config.fallback || "Nerozumím, zkus to jinak.");
      if (match && match.isWin) won = true;
      transcript.push({ role: "ai", text: aiText });
      chat.appendChild(el("div", { class: "bubble ai" }, aiText));
      chat.scrollTop = chat.scrollHeight;
    }
    function doSend() {
      if (container.dataset.locked) return;
      const text = input.value.trim();
      if (!text || turns >= (config.maxTurns || 5)) return;
      input.value = "";
      turns++;
      transcript.push({ role: "user", text });
      chat.appendChild(el("div", { class: "bubble user" }, text));
      chat.scrollTop = chat.scrollHeight;
      setTimeout(() => reply(text), 250);
    }
    send.addEventListener("click", doSend);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") doSend(); });
    container.appendChild(chat);
    container.appendChild(el("div", { style: "display:flex;gap:.5rem" }, [input, send]));
    container.appendChild(el("div", { style: "font-size:.78rem;color:var(--text-muted);margin-top:.4rem", id: "sim-turns" }, `Tah: 0 / ${config.maxTurns || 5}`));
    return {
      getAnswer() { return { transcript, turns, won }; },
      onResult(r) {
        container.dataset.locked = "1";
        input.disabled = true; send.disabled = true;
        const t = qs("#sim-turns", container); if (t) t.textContent = `Výsledek: ${r.is_correct ? "Cíl dosažen! 🎉" : "Cíl nedosažen."}`;
      },
      destroy() {},
    };
  },
};
