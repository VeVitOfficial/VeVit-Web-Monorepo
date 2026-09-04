"use client";

// Moje lekce – port edu/js/pages/my-lesson.js. Detail vlastní lekce:
// CustomBlocks + Attribution, tlačítko smazat (confirm + deleteCustomLesson +
// toast + navigate na dashboard). Třídy identické s legacy. Vše přes JSX
// (auto-escape), žádný dangerouslySetInnerHTML.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEduBreadcrumbs } from "../breadcrumbs";
import { useEduLang } from "../i18n";
import { useToast } from "../ui";
import { Icon } from "../blocks/icon";
import { CustomBlocks, Attribution, type CustomLessonLike } from "../blocks/custom-blocks";
import {
  getCustomLesson,
  deleteCustomLesson,
  type CustomLesson,
} from "@/lib/edu/custom-lessons";

function formatDate(iso: string | number | undefined): string {
  if (iso === undefined) return "";
  try {
    return new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return String(iso);
  }
}

export function EduMyLessonPage({ locale, query }: { locale: string; query: string }) {
  void locale;
  const { lang } = useEduLang();
  const { setBreadcrumbs } = useEduBreadcrumbs();
  const { toast } = useToast();
  const router = useRouter();

  // `query` je hodnota searchParamu `slug` (již oříznutá v route).
  const slug = (query || "").trim() || undefined;

  const [lesson, setLesson] = useState<CustomLesson | null | "loading" | "notfound">("loading");

  // Načtení vlastní lekce z localStorage (synchronous, ale setState
  // přes then-callback respektuje react-hooks pravidlo).
  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled) return;
        if (!slug) { setLesson("notfound"); return; }
        const l = getCustomLesson(slug);
        setLesson(l || "notfound");
      });
    return () => { cancelled = true; };
  }, [slug]);

  // Breadcrumbs podle toho, zda známe lekci.
  useEffect(() => {
    if (lesson && lesson !== "loading" && lesson !== "notfound") {
      setBreadcrumbs([
        { label: "Domů", href: `/${lang}/edu/dashboard/` },
        { label: "Lekce", href: `/${lang}/edu/dashboard/` },
        { label: lesson.title },
      ]);
    } else {
      setBreadcrumbs([
        { label: "Domů", href: `/${lang}/edu/dashboard/` },
        { label: "Lekce", href: `/${lang}/edu/dashboard/` },
        { label: "Moje lekce" },
      ]);
    }
  }, [lesson, lang, setBreadcrumbs]);

  function handleDelete() {
    if (!lesson || lesson === "loading" || lesson === "notfound") return;
    if (!confirm("Opravdu smazat tuto lekci?")) return;
    deleteCustomLesson(lesson.slug);
    toast("Lekce smazána.", "success");
    router.replace(`/${lang}/edu/dashboard/`);
  }

  if (lesson === "loading") {
    return <div className="max-w-3xl mx-auto p-16 text-center text-muted">Načítám lekci…</div>;
  }
  if (lesson === "notfound" || !lesson) {
    return (
      <div className="max-w-xl mx-auto p-16 text-center">
        <div className="text-6xl font-bold gradient-text mb-4">404</div>
        <p className="text-muted mb-6">Lekce nebyla nalezena.</p>
        <button
          type="button"
          onClick={() => router.push(`/${lang}/edu/dashboard/`)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
        >
          Zpět domů
        </button>
      </div>
    );
  }

  const like: CustomLessonLike = lesson as CustomLessonLike;

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push(`/${lang}/edu/dashboard/`)}
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-emerald-500 transition-colors mb-4"
          >
            <Icon name="arrow-left" className="h-4 w-4" />
            Zpět na přehled
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">{(lesson.category as string) || "Ostatní"}</span>
                <span className="text-[var(--color-text-muted)]">•</span>
                <span className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                  <Icon name="calendar" className="h-3 w-3" />
                  {formatDate(lesson.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">{lesson.title}</h1>
              {lesson.description ? (
                <p className="text-sm text-[var(--color-text-muted)] mt-2">{String(lesson.description)}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 h-8 w-8 rounded-md flex items-center justify-center shrink-0"
              title="Smazat lekci"
            >
              <Icon name="trash-2" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <article className="flex flex-col gap-2">
          <CustomBlocks lesson={like} />
        </article>
        <div className="mt-8">
          <Attribution lesson={like} />
        </div>
      </main>
    </div>
  );
}