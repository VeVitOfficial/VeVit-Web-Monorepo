"use client";

// AI asistent (chat) — React port legacy tools/assets/js/tools/ai-chat.js.
// Stream z /tools/api/ai/ollama.php (NDJSON), výstup přes VeVitMarkdown
// (marked + DOMPurify + safe-markdown, líně načítané z public URL). Markup i
// logika 1:1 s legacy (identické classNames, aby public/tools/assets/css/style.css
// fungoval). Komponenta renderuje POUZE vnitřní tělo (.ai-chat) — shell dodává
// stránka src/app/tools/[tool]/page.tsx.
//
// Odchylka od legacy: proxy route (src/app/tools/api/ai/ollama.php/route.ts)
// odmítá `model` v těle (model vybírá server) — legacy posílalo model:'llama3.2';
// port ho neodesílá. URL končí na `.php` (Next route), legacy volalo bez přípony.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";
import { copyText, loadScript, useToolUi } from "@/components/tools/tool-runtime";

// ── Sdílené AI helpery (port lib/ai-tool.js + lib/safe-markdown.js) ──────
// Duplikováno v každém AI nástroji — batch agent smí editovat jen vlastní
// soubory (nelze vytvořit sdílený modul). loadScript cachuje per-src.

type VvMd = { renderInto(el: HTMLElement, md: string): boolean };
function vvMd(): VvMd | undefined {
  return (window as unknown as { VeVitMarkdown?: VvMd }).VeVitMarkdown;
}
let mdLibP: Promise<void> | null = null;
async function ensureMarkdown(): Promise<void> {
  if (mdLibP) return mdLibP;
  mdLibP = (async () => {
    await loadScript("/tools/assets/js/lib/marked.min.js");
    await loadScript("/tools/assets/js/lib/purify.min.js");
    await loadScript("/tools/assets/js/lib/safe-markdown.js");
  })();
  return mdLibP;
}

interface AiOpts {
  tool: string;
  prompt: string;
  images?: string[];
  onToken: (full: string) => void;
  onDone: (full: string) => void;
  onError: (msg: string) => void;
}
function runAi(opts: AiOpts): { abort: () => void } {
  const controller = new AbortController();
  let full = "";
  let done = false;
  const body: Record<string, unknown> = { prompt: opts.prompt, tool: opts.tool, stream: true };
  if (opts.images && opts.images.length) body.images = opts.images;
  fetch("/tools/api/ai/ollama.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        let d: { message?: string; error?: string } = {};
        try { d = (await res.json()) as { message?: string; error?: string }; } catch { /* ignore */ }
        throw new Error(d.message || d.error || `HTTP ${res.status}`);
      }
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const ch = await reader.read();
        if (ch.done) { if (!done) { done = true; opts.onDone(full); } return; }
        buf += dec.decode(ch.value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const p = JSON.parse(line) as { response?: string; text?: string; done?: boolean };
            if (p.response || p.text) { full += p.response || p.text; opts.onToken(full); }
            if (p.done) { done = true; opts.onDone(full); return; }
          } catch { /* ignoruj nevalidní řádek */ }
        }
      }
    })
    .catch((e: unknown) => {
      if ((e instanceof DOMException || e instanceof Error) && e.name === "AbortError") {
        if (!done) opts.onDone(full);
        return;
      }
      const msg = e instanceof Error ? e.message : "";
      opts.onError(msg || "Nastala neznámá chyba. Zkuste to znovu.");
    });
  return { abort: () => controller.abort() };
}

// ── cs řetězce (legacy cs-only, ostatní locale fallback na cs) ──────────
const TXT = {
  model: "Model: llama3.2",
  connReady: "Připraveno ke zpracování",
  connProc: "Probíhá zpracování",
  newChat: "Nový chat",
  emptyTitle: "AI asistent",
  emptyMuted: "Zeptejte se na cokoliv. Odpovědi se generují lokálně přes Ollama.",
  starters: ["Vysvětli mi složité téma jednoduše", "Pomoz mi vytvořit praktický plán", "Vylepši srozumitelnost mého textu"],
  placeholder: "Napište zprávu...",
  stop: "Zastavit",
  copyLabel: "Kopírovat odpověď",
  retryLabel: "Zopakovat dotaz",
  thinking: "Přemýšlím…",
  interrupted: "Odpověď byla zastavena.",
  unknownError: "Nastala neznámá chyba. Zkuste to znovu.",
  disclaimer: "AI může chybovat. Nezadávejte citlivé údaje a důležité informace si ověřte.",
};

interface Msg { id: number; role: "user" | "bot"; text: string; }
let msgSeq = 0;

export default function AiChat({ locale }: ToolComponentProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [showEmpty, setShowEmpty] = useState(true);
  const [input, setInput] = useState("");
  const controllerRef = useRef<{ abort: () => void } | null>(null);
  const lastPromptRef = useRef<string>("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // data-tool-state na #tool-root (shell dodává element).
  useEffect(() => {
    const el = document.getElementById("tool-root");
    if (el) el.setAttribute("data-tool-state", isLoading ? "processing" : (messages.length ? "success" : "idle"));
  }, [isLoading, messages.length]);

  const scrollBottom = useCallback(() => {
    Promise.resolve().then(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  const send = useCallback((promptRaw: string) => {
    const prompt = promptRaw.trim();
    if (!prompt || isLoading) return;
    setError("");
    lastPromptRef.current = prompt;
    setShowEmpty(false);
    const userMsg: Msg = { id: ++msgSeq, role: "user", text: prompt };
    const botMsg: Msg = { id: ++msgSeq, role: "bot", text: "" };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setLoading(true);
    scrollBottom();

    controllerRef.current = runAi({
      tool: "ai-chat",
      prompt,
      onToken: (full) => {
        setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? { ...m, text: full } : m)));
        scrollBottom();
      },
      onDone: (full) => {
        if (!full) {
          setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? { ...m, text: TXT.interrupted } : m)));
        }
        setLoading(false);
        controllerRef.current = null;
      },
      onError: (msg) => {
        setError(msg);
        // Pokud asistent nic neodpověděl, odstraň jeho prázdnou bublinu (1:1 legacy).
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "bot" && last.id === botMsg.id && !last.text) {
            return prev.slice(0, -1);
          }
          return prev.map((m) => (m.id === botMsg.id ? { ...m, text: m.text } : m));
        });
        setLoading(false);
        controllerRef.current = null;
      },
    });
  }, [isLoading, scrollBottom]);

  const submit = useCallback(() => {
    if (isLoading) {
      if (controllerRef.current) controllerRef.current.abort();
      return;
    }
    const text = input;
    if (!text.trim()) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    send(text);
  }, [isLoading, input, send]);

  const newChat = useCallback(() => {
    if (controllerRef.current) controllerRef.current.abort();
    setMessages([]);
    setShowEmpty(true);
    setInput("");
    setError("");
    lastPromptRef.current = "";
    if (taRef.current) taRef.current.style.height = "auto";
    Promise.resolve().then(() => taRef.current?.focus());
  }, []);

  const onStarter = useCallback((text: string) => {
    setInput(text);
    Promise.resolve().then(() => taRef.current?.focus());
  }, []);

  const onTaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="ai-chat" data-copy-label={TXT.copyLabel} data-retry-label={TXT.retryLabel}>
      <div className="ai-head">
        <span className="badge badge-ai">AI</span>
        <span className="muted" style={{ fontSize: "0.875rem" }}>{TXT.model}</span>
        <span className={`ai-connection${isLoading ? " is-active" : ""}`} id="ai-connection">
          <span></span>{isLoading ? TXT.connProc : TXT.connReady}
        </span>
        <button className="btn btn-ghost btn-sm" id="ai-new" type="button" style={{ marginLeft: "auto" }} onClick={newChat}>{TXT.newChat}</button>
      </div>

      <div className="ai-messages" id="ai-messages" ref={scrollRef}>
        {showEmpty ? (
          <div className="ai-empty" id="ai-empty">
            <div className="ai-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
            </div>
            <p className="ai-empty-title">{TXT.emptyTitle}</p>
            <p className="muted" style={{ fontSize: "0.875rem" }}>{TXT.emptyMuted}</p>
            <div className="ai-starters">
              {TXT.starters.map((s) => (
                <button key={s} className="ai-starter" type="button" onClick={() => onStarter(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) => (
          m.role === "user" ? (
            <div key={m.id} className="msg user">
              <div className="bubble"><p>{m.text}</p></div>
              <div className="avatar user"><UserIcon /></div>
            </div>
          ) : (
            <BotBubble key={m.id} msg={m} locale={locale} copyLabel={TXT.copyLabel} retryLabel={TXT.retryLabel} thinking={TXT.thinking} streaming={isLoading && m.id === messages[messages.length - 1].id} onRetry={() => send(lastPromptRef.current)} />
          )
        ))}
      </div>

      <div className={`ai-error${error ? "" : " hidden"}`} id="ai-error">
        <span className="ai-error-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
        </span>
        <span id="ai-error-text">{error}</span>
      </div>

      <div className="ai-input">
        <textarea
          className="textarea"
          id="ai-input"
          ref={taRef}
          placeholder={TXT.placeholder}
          value={input}
          disabled={isLoading}
          onChange={onTaInput}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
        />
        <button className="btn btn-primary btn-lg" id="ai-send" type="button" style={{ flexShrink: 0 }} onClick={submit}>
          {isLoading ? (
            <span className="ico ico-stop">{TXT.stop}</span>
          ) : (
            <span className="ico ico-send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /><path d="m21.854 2.147-10.94 10.939" /></svg>
            </span>
          )}
        </button>
      </div>
      <p className="ai-disclaimer">{TXT.disclaimer}</p>
    </div>
  );
}

// ── BotBubble — vykreslí markdown asistenta (s copy tlačítky u bloků kódu) ─
function BotBubble({ msg, locale, copyLabel, retryLabel, thinking, streaming, onRetry }: {
  msg: Msg;
  locale: ToolComponentProps["locale"];
  copyLabel: string;
  retryLabel: string;
  thinking: string;
  streaming: boolean;
  onRetry: () => void;
}) {
  const mdRef = useRef<HTMLDivElement | null>(null);
  const { t } = useToolUi(locale);

  useEffect(() => {
    if (!mdRef.current) return;
    let cancelled = false;
    ensureMarkdown().then(() => {
      if (cancelled || !mdRef.current) return;
      const api = vvMd();
      if (!api || !api.renderInto(mdRef.current, msg.text)) {
        mdRef.current.textContent = msg.text || "";
        return;
      }
      // Přidej copy tlačítko každému <pre> bloku (1:1 legacy ai-chat.js).
      mdRef.current.querySelectorAll("pre").forEach((block) => {
        if (block.querySelector(".code-copy")) return;
        const code = block.querySelector("code");
        if (!code) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-ghost btn-sm code-copy";
        btn.textContent = t("copy");
        btn.addEventListener("click", () => { void copyText(code.textContent || "", locale); });
        block.appendChild(btn);
      });
    });
    return () => { cancelled = true; };
  }, [msg.text, locale, t]);

  const showThinking = streaming && !msg.text;

  return (
    <div className="msg bot">
      <div className="avatar bot"><BotIcon /></div>
      <div className="bubble">
        {showThinking ? (
          <div className="ai-typing">
            <div className="spinner"></div>
            {thinking}
          </div>
        ) : (
          <div className="markdown-body" ref={mdRef} />
        )}
        <div className="msg-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { const el = mdRef.current; void copyText(el?.innerText || el?.textContent || "", locale); }}>{copyLabel}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>{retryLabel}</button>
        </div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  );
}
function BotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
  );
}