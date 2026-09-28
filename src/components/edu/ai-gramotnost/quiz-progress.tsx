"use client";

// Panel kvízového postupu, opakování a anonymní peer review na přehledu
// (port mountQuizProgress + appendPeerReviews z lesson-runtime.mjs).

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProgress } from "./progress";
import { useAiGram } from "./shell";
import type { Dict } from "./types";

const BADGES: [string, string, string][] = [
  ["archeolog-ai", "Archeolog AI", "Kapitola 1"], ["mechanik-neuronu", "Mechanik neuronů", "Kapitola 2"],
  ["promptovy-kovar", "Promptový kovář", "Kapitola 3"], ["integrator", "Integrátor", "Kapitola 4"],
  ["stavitel", "Stavitel", "Kapitola 5"], ["skeptik-s-certifikatem", "Skeptik s certifikátem", "Kapitola 6"],
  ["detektiv-halucinaci", "Detektiv halucinací", "Skrytý"], ["tokenovy-lakomec", "Tokenový lakomec", "Skrytý"],
  ["kalibrovany", "Kalibrovaný", "Skrytý"],
];

interface QuizState {
  states?: { xp_total?: number }[];
  streak?: number;
  badges?: { badge_key: string }[];
  reviews?: { question_id: string; interval_days: number; due_at: string }[];
}

interface PeerReview {
  submission_id: unknown;
  question_id: string;
  body: string;
  rubric?: { label: string; hint?: string }[];
}

function PeerReviewCard({ review }: { review: PeerReview }) {
  const { api } = useAiGram();
  const rubric = review.rubric || [];
  const [scores, setScores] = useState<(number | null)[]>(() => rubric.map(() => null));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState("");
  const incomplete = scores.some((score) => !Number.isInteger(score));
  async function save() {
    setBusy(true);
    try {
      const result = await api.savePeerReview(review.submission_id, scores) as { reviewed?: boolean; xp_awarded?: number };
      setDone(true);
      setStatus(result.reviewed ? `Hodnocení uloženo · +${result.xp_awarded} XP` : "Tuto odpověď už ohodnotil někdo jiný.");
    } catch {
      setBusy(false);
      setStatus("Hodnocení se nepodařilo uložit.");
    }
  }
  return (
    <article className="card quiz-peer-review__card">
      <h3>{`Odpověď k otázce ${review.question_id}`}</h3>
      <blockquote>{review.body}</blockquote>
      {rubric.map((criterion, index) => (
        <label key={index} className="quiz-self-rubric__row">
          <span>{criterion.hint ? `${criterion.label} — ${criterion.hint}` : criterion.label}</span>
          <select
            aria-label={`${criterion.label}: hodnocení 0 až 5`}
            value={scores[index] === null ? "" : String(scores[index])}
            onChange={(e) => setScores((s) => s.map((v, i) => (i === index ? (e.target.value === "" ? null : Number(e.target.value)) : v)))}
          >
            <option value="">Vyber 0–5</option>
            {[0, 1, 2, 3, 4, 5].map((value) => <option key={value} value={String(value)}>{value}</option>)}
          </select>
        </label>
      ))}
      <button type="button" className="btn btn-primary" disabled={incomplete || busy || done} onClick={save}>Odeslat anonymní hodnocení</button>
      <p role="status">{status}</p>
    </article>
  );
}

function PeerReviews() {
  const { api } = useAiGram();
  const [reviews, setReviews] = useState<PeerReview[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api.peerReviews()
      .then((data) => setReviews(Array.isArray((data as Dict).reviews) ? ((data as Dict).reviews as PeerReview[]) : []))
      .catch(() => setFailed(true));
  }, [api]);
  return (
    <section className="quiz-peer-review">
      <h2>Anonymní peer review</h2>
      {failed ? <p>Peer review je dočasně nedostupné.</p> : null}
      {reviews && !reviews.length ? <p>Teď nejsou dostupné žádné cizí odpovědi k hodnocení.</p> : null}
      {(reviews || []).map((review, index) => <PeerReviewCard key={index} review={review} />)}
    </section>
  );
}

export function QuizProgressPanels() {
  const { api, path } = useAiGram();
  const progress = useProgress();
  const [state, setState] = useState<{ data: QuizState; due: NonNullable<QuizState["reviews"]> } | null>(null);
  useEffect(() => {
    api.state()
      .then((value) => {
        const data = value as QuizState;
        const now = Date.now();
        setState({ data, due: (data.reviews || []).filter((item) => new Date(item.due_at).getTime() <= now) });
      })
      .catch(() => {});
  }, [api]);
  // Stejně jako originál: bez odpovědi serveru se panely nevykreslí.
  if (!state) return null;
  const { data, due } = state;
  const quizXp = (data.states || []).reduce((sum, item) => sum + Number(item.xp_total || 0), 0);
  const streak = Number(data.streak || 0);
  const earned = new Set((data.badges || []).map((badge) => badge.badge_key));
  return (
    <>
      <section className="card quiz-progress">
        <h2>Tvůj postup</h2>
        <p><strong>Za lekce:</strong> {progress.totalXp} XP</p>
        <p><strong>Za kvízy:</strong> {quizXp} XP</p>
        <p className="quiz-streak">{`🔥 Série: ${streak} správně za sebou · ${streak >= 3 ? "×1,25 aktivní" : "×1 po správných odpovědích"}`}</p>
        <h3>Odznaky</h3>
        <div className="quiz-badge-gallery">
          {BADGES.map(([key, title, description]) => (
            <div key={key} className={`quiz-badge-card ${earned.has(key) ? "is-earned" : ""}`}>
              {earned.has(key) ? `✓ ${title}` : `🔒 ${title} — ${description}`}
            </div>
          ))}
        </div>
      </section>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Na zopakování</h2>
        {!due.length ? <p>Dnes nemáš nic k opakování.</p> : null}
        {due.map((item) => (
          <Link key={item.question_id} href={path("kurz")} className="lesson-row">
            {`${item.question_id} · interval ${item.interval_days} dní`}
          </Link>
        ))}
        <PeerReviews />
      </div>
    </>
  );
}
