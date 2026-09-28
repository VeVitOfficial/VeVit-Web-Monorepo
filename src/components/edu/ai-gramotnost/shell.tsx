"use client";

// Kontext AI gramotnosti: přihlášení (+ CSRF pro kvízové API), jazyk, katalog
// kurzu. Po přihlášení odešle pokusy uložené offline (port lesson-runtime.mjs).

import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { checkAchievements } from "./progress";
import { createQuizApi, flushOfflineQueue, type QuizApi } from "./quiz-api";
import type { CourseDetail } from "./types";

interface AiGramContextValue {
  authenticated: boolean;
  api: QuizApi;
  locale: string;
  course: CourseDetail;
  path: (rest?: string) => string;
}

const AiGramContext = createContext<AiGramContextValue | null>(null);

export function useAiGram(): AiGramContextValue {
  const value = useContext(AiGramContext);
  if (!value) throw new Error("useAiGram mimo AiGramShell");
  return value;
}

export function AiGramShell({ authenticated, csrfToken, locale, course, children }: {
  authenticated: boolean;
  csrfToken: string;
  locale: string;
  course: CourseDetail;
  children: ReactNode;
}) {
  const value = useMemo<AiGramContextValue>(() => ({
    authenticated,
    api: createQuizApi(csrfToken),
    locale,
    course,
    path: (rest = "") => `/${locale}/edu/ai-gramotnost${rest ? `/${rest}` : ""}`,
  }), [authenticated, csrfToken, locale, course]);

  useEffect(() => {
    checkAchievements(course);
  }, [course]);

  useEffect(() => {
    if (!authenticated) return;
    const flush = () => {
      flushOfflineQueue(value.api).catch(() => {});
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [authenticated, value.api]);

  return (
    <AiGramContext.Provider value={value}>
      <div className="aigram">
        <main className="aigram-main fade-in">{children}</main>
      </div>
    </AiGramContext.Provider>
  );
}
