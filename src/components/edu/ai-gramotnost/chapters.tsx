"use client";

// Seznam kapitol s lekcemi a milníky (port renderChapters z components.js).

import Link from "next/link";
import { AiGramIcon } from "./icons";
import { useProgress } from "./progress";
import { useAiGram } from "./shell";

export function ChapterList() {
  const { course, path } = useAiGram();
  const progress = useProgress();
  return (
    <>
      {(course.chapters || []).map((chapter, ci) => {
        const milestone = ci < 5 ? `boss-${ci + 1}` : "final-6";
        return (
          <div key={chapter.id} className="chapter">
            <div className="chapter-head">
              <span className="num">{ci + 1}</span>
              <strong>{chapter.title}</strong>
            </div>
            {(chapter.lessons || []).map((lesson) => {
              const completed = progress.completedLessons.includes(Number(lesson.id));
              return (
                <Link key={lesson.id} className="lesson-row" href={path(`lekce/${encodeURIComponent(lesson.slug)}`)}>
                  <span className={`status-ic ${completed ? "completed" : "available"}`}>
                    <AiGramIcon name={completed ? "check" : "play"} />
                  </span>
                  <span className="ltitle">{lesson.title}</span>
                  <span className="lmeta">
                    <span>{lesson.duration || 15} min</span>
                    <span>+{lesson.xp_reward || 25} XP</span>
                  </span>
                </Link>
              );
            })}
            <Link className="lesson-row quiz-milestone-link" href={path(`milnik/${milestone}`)}>
              <span className="status-ic available"><AiGramIcon name="trophy" /></span>
              <span className="ltitle">{ci < 5 ? `Boss kvíz kapitoly ${ci + 1}` : "Závěrečný test a reflexe"}</span>
              <span className="lmeta"><span>{ci < 5 ? "10 otázek · 3 životy" : "25 otázek · adaptivní"}</span></span>
            </Link>
          </div>
        );
      })}
    </>
  );
}
