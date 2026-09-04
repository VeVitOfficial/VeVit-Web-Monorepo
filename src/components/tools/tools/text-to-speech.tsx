"use client";

// Text na řeč přes Web Speech API, čistě client-side. Port legacy text-to-speech.js.
// Načítání seznamu hlasů je asynchronní (voiceschanged) — obslouženo v effectu.
// Komponenta renderuje pouze vnitřní tělo .tool-tool — shell dodává stránka.
import { useCallback, useEffect, useState } from "react";
import type { ToolComponentProps } from "@/components/tools/registry/data";

const PAUSE_LABELS = { pause: "Pozastavit", resume: "Pokračovat" } as const;

export default function TextToSpeech({ locale }: ToolComponentProps) {
  void locale;
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [langFilter, setLangFilter] = useState("");
  const [voiceIdx, setVoiceIdx] = useState<number>(-1);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [paused, setPaused] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Detekce podpory + načtení hlasů (async). Věrně legacy loadVoices/onvoiceschanged.
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      Promise.resolve().then(() => {
        setSupported(false);
        setError("Váš prohlížeč nepodporuje Web Speech API.");
        setHasError(true);
      });
      return;
    }
    const load = () => {
      const list = window.speechSynthesis.getVoices() || [];
      if (!list.length) return;
      Promise.resolve().then(() => setVoices(list));
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Filtrovaný seznam hlasů podle zvoleného jazyka (jako legacy fillVoices).
  const filteredVoices = useCallback((): SpeechSynthesisVoice[] => {
    const f = langFilter;
    let list = voices.filter((v) => !f || v.lang === f);
    if (!list.length) list = voices;
    return list;
  }, [langFilter, voices]);

  const langs = voices.length ? Array.from(new Set(voices.map((v) => v.lang))).sort() : [];
  const voiceList = filteredVoices();

  // Po změně hlasů zvol preferovaný cs/sk hlas (jako legacy fillVoices prefer).
  // setState v effektu přes Promise.resolve().then() — react-hooks v6 pravidlo.
  useEffect(() => {
    if (!voices.length) return;
    const pref = voices.find((v) => /^cs|^sk/i.test(v.lang));
    if (pref) Promise.resolve().then(() => setVoiceIdx(voices.indexOf(pref)));
  }, [voices]);

  // Po změně lang filtru zkus zachovat aktuální hlas, jinak zvol preferovaný.
  useEffect(() => {
    if (!voices.length) return;
    const list = filteredVoices();
    const pref = list.find((v) => /^cs|^sk/i.test(v.lang));
    if (pref) Promise.resolve().then(() => setVoiceIdx(voices.indexOf(pref)));
  }, [langFilter, voices, filteredVoices]);

  const fail = useCallback((m: string) => { setError(m); setHasError(true); }, []);
  const clearErr = useCallback(() => { setError(""); setHasError(false); }, []);

  const onSpeak = useCallback(() => {
    clearErr();
    if (!("speechSynthesis" in window)) return;
    const trimmed = text.trim();
    if (!trimmed) return fail("Zadejte text k přečtení.");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(trimmed);
    if (!isNaN(voiceIdx) && voices[voiceIdx]) { u.voice = voices[voiceIdx]; u.lang = voices[voiceIdx].lang; }
    u.rate = rate; u.pitch = pitch;
    u.onerror = (e) => { if (e.error !== "canceled" && e.error !== "interrupted") fail("Chyba řeči: " + (e.error || "neznámá")); };
    setPaused(false);
    window.speechSynthesis.speak(u);
  }, [text, voiceIdx, voices, rate, pitch, fail, clearErr]);

  const onPause = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPaused(false); }
      else { window.speechSynthesis.pause(); setPaused(true); }
    }
  }, []);

  const onStop = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setPaused(false);
  }, []);

  if (!supported) {
    return (
      <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
        <p className="error-text" id="ts-error" role="alert">{error}</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: "46rem", margin: "0 auto" }}>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ts-in">Text</label>
        <textarea className="textarea" id="ts-in" rows={6} placeholder="Zadejte text k přečtení…" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="two-col" style={{ gap: "0.75rem" }}>
        <div className="stack-sm">
          <label className="field-label" htmlFor="ts-voice">Hlas</label>
          <select className="select" id="ts-voice" value={voiceIdx} onChange={(e) => setVoiceIdx(+e.target.value)}>
            {voices.length === 0 ? <option value="">Načítám…</option> : null}
            {voiceList.map((v) => (
              <option key={voices.indexOf(v)} value={voices.indexOf(v)}>{v.name} ({v.lang})</option>
            ))}
          </select>
        </div>
        <div className="stack-sm">
          <label className="field-label" htmlFor="ts-lang">Jazyk (filtr)</label>
          <select className="select" id="ts-lang" value={langFilter} onChange={(e) => setLangFilter(e.target.value)}>
            <option value="">Všechny</option>
            {langs.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ts-rate">Rychlost: <span id="ts-rate-v">{rate.toFixed(1)}</span>×</label>
        <input type="range" id="ts-rate" min={0.5} max={2} step={0.1} value={rate} style={{ width: "100%" }} onChange={(e) => setRate(+e.target.value)} />
      </div>
      <div className="stack-sm">
        <label className="field-label" htmlFor="ts-pitch">Výška: <span id="ts-pitch-v">{pitch.toFixed(1)}</span>×</label>
        <input type="range" id="ts-pitch" min={0} max={2} step={0.1} value={pitch} style={{ width: "100%" }} onChange={(e) => setPitch(+e.target.value)} />
      </div>
      <div className="row" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
        <button className="btn btn-primary" id="ts-speak" type="button" onClick={onSpeak}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" /><path d="M16 9a5 5 0 0 1 0 6" /><path d="M19.364 18.364a9 9 0 0 0 0-12.728" /></svg>
          Přečíst
        </button>
        <button className="btn btn-secondary" id="ts-pause" type="button" onClick={onPause}>{paused ? PAUSE_LABELS.resume : PAUSE_LABELS.pause}</button>
        <button className="btn btn-ghost" id="ts-stop" type="button" onClick={onStop}>Zastavit</button>
      </div>
      {hasError ? <p className="error-text" id="ts-error" role="alert">{error}</p> : null}
      <p className="muted" style={{ fontSize: "0.8rem" }}>Používá Web Speech API prohlížeče. Český hlas nemusí být dostupný — záleží na systému/OS. Nic se neodesílá na server (vyjma hlasů, jež dodává prohlížeč/OS).</p>
    </div>
  );
}