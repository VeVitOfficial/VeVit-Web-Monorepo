// Port edu/js/lib/ai.js — dotaz do LLM přes PHP proxy (klíč server-side).
// Endpoint: /edu/php/ai-proxy.php (legacy volal relativní „php/ai-proxy.php"
// s base href=/edu/ → résolvuje na /edu/php/ai-proxy.php).

export interface AIAnswer {
  answer_text: string;
  exact_quote: string;
}

// Vrací { answer_text, exact_quote } nebo vyhodí chybu.
export async function askAI(question: string, context: string): Promise<AIAnswer> {
  const res = await fetch("/edu/php/ai-proxy.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, context }),
  });
  let data: { answer_text?: string; exact_quote?: string; error?: string } | null = null;
  try {
    data = (await res.json()) as { answer_text?: string; exact_quote?: string; error?: string };
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return {
    answer_text: (data && data.answer_text) || "",
    exact_quote: (data && data.exact_quote) || "",
  };
}