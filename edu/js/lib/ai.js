// AI – dotaz do LLM přes PHP proxy (klíč server-side)

// Vrací { answer_text, exact_quote } nebo vyhodí chybu
export async function askAI(question, context) {
  const res = await fetch("php/ai-proxy.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context }),
  });
  let data = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return {
    answer_text: (data && data.answer_text) || "",
    exact_quote: (data && data.exact_quote) || "",
  };
}
