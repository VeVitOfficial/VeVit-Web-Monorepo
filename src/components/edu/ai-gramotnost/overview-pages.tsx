"use client";

// Přehled, stránka kurzu a profil AI gramotnosti (port renderDashboard,
// renderCourse a renderProfile z components.js).

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChapterList } from "./chapters";
import { AiGramIcon } from "./icons";
import { ACHIEVEMENTS, formatXP, resetProgress, useProgress, xpIntoNextLevel } from "./progress";
import { QuizProgressPanels } from "./quiz-progress";
import { useAiGram } from "./shell";
import type { ChapterIntro } from "./types";

/** Staré odkazy hash routeru (#lesson/slug, #course, …) → nové routy. */
function useLegacyHashRedirect() {
  const router = useRouter();
  const { path } = useAiGram();
  useEffect(() => {
    let parts: string[];
    try {
      parts = decodeURIComponent(window.location.hash.slice(1)).split("/");
    } catch {
      return; // poškozený hash ignorujeme
    }
    const [segment] = parts;
    let target: string | null = null;
    if (segment === "lesson" && parts[1]) target = path(`lekce/${encodeURIComponent(parts.slice(1).join("/"))}`);
    else if (segment === "milestone" && parts[1]) {
      const attempt = Math.max(1, Number(parts[2] || 1));
      target = path(`milnik/${encodeURIComponent(parts[1])}${attempt > 1 ? `?pokus=${attempt}` : ""}`);
    } else if (segment === "course") target = path("kurz");
    else if (segment === "profile") target = path("profil");
    if (target) router.replace(target);
  }, [router, path]);
}

export function AiGramDashboard() {
  useLegacyHashRedirect();
  const { course, authenticated } = useAiGram();
  const progress = useProgress();
  const total = (course.chapters || []).reduce((sum, chapter) => sum + (chapter.lessons || []).length, 0);
  const done = progress.completedLessons.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const level = xpIntoNextLevel(progress.totalXp);
  return (
    <>
      <section className="hero">
        <h1>AI <span className="grad">Gramotnost</span></h1>
        <p>{course.description || "Kompletní kurz AI gramotnosti."}</p>
        <div className="stat-grid">
          <div className="stat-box"><div className="num">{total}</div><div className="lbl">lekcí</div></div>
          <div className="stat-box"><div className="num">{formatXP(course.total_xp || 0)}</div><div className="lbl">XP celkem</div></div>
          <div className="stat-box"><div className="num">{done}/{total}</div><div className="lbl">dokončeno</div></div>
        </div>
      </section>
      {authenticated ? (
        <>
          <QuizProgressPanels />
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
              <strong>Tvůj postup</strong>
              <span style={{ color: "var(--primary)" }}>{done}/{total} • {pct}%</span>
            </div>
            <div className="progress-mini"><div style={{ width: `${pct}%` }} /></div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
              <div><span className="tag">Level {level.level}</span> <span style={{ color: "var(--text-secondary)", fontSize: ".85rem" }}>{level.into}/{level.need} XP</span></div>
              <div><span className="tag"><AiGramIcon name="flame" /> {progress.streak} dní</span> <span style={{ color: "var(--text-secondary)", fontSize: ".85rem" }}>streak</span></div>
              <div><span className="tag">{formatXP(progress.totalXp)} XP</span></div>
              <div><span className="tag">{progress.achievements.length}/{ACHIEVEMENTS.length}</span> <span style={{ color: "var(--text-secondary)", fontSize: ".85rem" }}>achievementů</span></div>
            </div>
          </div>
        </>
      ) : (
        <div className="card" style={{ marginBottom: "1.5rem" }}><p>Pro zobrazení postupu a XP se přihlaste.</p></div>
      )}
      <ChapterList />
    </>
  );
}

function ChapterIntroduction({ chapter }: { chapter: ChapterIntro }) {
  return (
    <section className="chapter-introduction card">
      <h1>{chapter.title || "Úvod kapitoly"}</h1>
      <section><h2>Háček</h2><p>{chapter.hook?.md || ""}</p></section>
      <section><h2>Tipni si</h2><p>{chapter.guess?.md || ""}</p></section>
      <section>
        <h2>Velká trojka</h2>
        <ol>{(chapter.bigThree || []).map((item, index) => <li key={index}>{item}</li>)}</ol>
      </section>
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- statické SVG ilustrace */}
        {chapter.figure?.src ? <img src={chapter.figure.src} alt={chapter.figure.alt || ""} /> : null}
        <figcaption>{chapter.figure?.caption || ""}</figcaption>
      </figure>
      <section><h2>Mise</h2><p>{chapter.mission?.md || ""}</p></section>
    </section>
  );
}

export function AiGramCourse({ intros }: { intros: ChapterIntro[] }) {
  const { course } = useAiGram();
  return (
    <>
      <section className="hero">
        <h1><span className="grad">{course.title}</span></h1>
        <p>{course.description || ""}</p>
      </section>
      <div id="chapter-intros">
        {intros.map((chapter) => <ChapterIntroduction key={chapter.chapter} chapter={chapter} />)}
      </div>
      <ChapterList />
    </>
  );
}

export function AiGramProfile() {
  const { authenticated, path } = useAiGram();
  const router = useRouter();
  const progress = useProgress();
  if (!authenticated) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: "3rem auto", textAlign: "center" }}>
        <p>Profil, XP a postup jsou dostupné po přihlášení.</p>
        <a className="btn btn-primary" style={{ marginTop: "1rem" }} href={`/account/login?return_to=${encodeURIComponent("/edu/ai-gramotnost/profil")}`}>Přihlásit se</a>
      </div>
    );
  }
  const level = xpIntoNextLevel(progress.totalXp);
  const unlocked = new Set(progress.achievements);
  return (
    <>
      <section className="hero"><h1>Profil</h1></section>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Lokální postup (bez přihlášení)</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: ".85rem", marginTop: ".4rem" }}>
          Progress se ukládá v tomto prohlížeči (localStorage). Po přihlášení do vevit edu bude synchronizován se serverem.
        </p>
        <div style={{ marginTop: "1rem" }}>
          <span className="tag">Level {level.level}</span> <span className="tag">{formatXP(progress.totalXp)} XP</span>{" "}
          <span className="tag"><AiGramIcon name="flame" /> {progress.streak} dní</span> <span className="tag">{progress.completedLessons.length} lekcí</span>
        </div>
        <div className="progress-mini" style={{ marginTop: "1rem" }}><div style={{ width: `${level.pct}%` }} /></div>
        <p style={{ fontSize: ".8rem", color: "var(--text-muted)", marginTop: ".4rem" }}>{level.into}/{level.need} XP do dalšího levelu</p>
      </div>
      <h2 style={{ marginBottom: "1rem" }}>Achievementy</h2>
      <div className="grid-2">
        {ACHIEVEMENTS.map((a) => {
          const on = unlocked.has(a.id);
          return (
            <div key={a.id} className="card" style={{ opacity: on ? 1 : 0.45 }}>
              <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
                <span style={{ width: 40, height: 40, borderRadius: "50%", background: on ? "var(--primary-glow)" : "var(--bg-elevated)", display: "grid", placeItems: "center", color: on ? "var(--primary)" : "var(--text-muted)" }}>
                  <AiGramIcon name={a.icon} />
                </span>
                <div>
                  <strong>{a.name}</strong>
                  <div style={{ fontSize: ".82rem", color: "var(--text-secondary)" }}>{a.description} • +{a.xp_reward} XP</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (confirm("Opravdu resetovat veškerý lokální progress (XP, dokončené lekce, achievementy)?")) {
              resetProgress();
              router.push(path());
            }
          }}
        >
          Resetovat lokální progress
        </button>
      </div>
    </>
  );
}
