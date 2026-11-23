// Skeletony VeVit Edu, sdílené pro loading.tsx (server) i klientské načítání dat
// (course-page, lesson-page, home, programování). Bez hooků, takže fungují na obou stranách.
import { Skeleton, SkeletonGrid, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

/** Místo pro navbar (#navbar má pevnou výšku 64 px v edu.css). */
export function EduNavbarSkeleton() {
  return (
    <div id="navbar" aria-hidden="true">
      <div className="edu-navbar">
        <div className="edu-navbar__inner" style={{ justifyContent: "space-between" }}>
          <Skeleton width="8rem" height="1.75rem" />
          <Skeleton width="6rem" height="2rem" />
        </div>
      </div>
    </div>
  );
}

/** Hero + karty kategorií (edu home, rozcestníky). */
export function EduHomeSkeleton() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <section className="eh-hero">
        <div className="eh-hero__text">
          <Skeleton width="min(28rem, 90%)" height="7.5rem" />
          <SkeletonText lines={2} lastLineWidth="70%" style={{ marginTop: "1.25rem", maxWidth: "34rem" }} />
          <Skeleton height="3.25rem" radius="0.75rem" style={{ marginTop: "1.5rem", maxWidth: "34rem" }} />
        </div>
      </section>
      <EduSectionSkeleton count={6} />
    </main>
  );
}

/** Nadpis sekce + mřížka karet. */
export function EduSectionSkeleton({ count = 6, minWidth = "17rem" }: { count?: number; minWidth?: string }) {
  return (
    <section className="mb-16">
      <Skeleton width="12rem" height="1.6rem" style={{ marginBottom: "1.25rem" }} />
      <SkeletonGrid count={count} minWidth={minWidth} card={{ lines: 2 }} />
    </section>
  );
}

/** Detail kurzu: ikona + titulek + popis, pak seznam kapitol. Kopíruje obálku course-page. */
export function EduCourseSkeleton() {
  return (
    <SkeletonRegion className="min-h-screen bg-[var(--color-background)]">
      <main className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        <div className="mb-10 md:mb-14">
          <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-8">
            <Skeleton width="3.5rem" height="3.5rem" radius="1rem" />
            <div className="flex-1 min-w-0">
              <Skeleton width="70%" height="2.5rem" />
              <SkeletonText lines={2} lastLineWidth="50%" style={{ marginTop: "1rem" }} />
            </div>
          </div>
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mb-4"><Skeleton height="4.5rem" radius="0.75rem" /></div>
        ))}
      </main>
    </SkeletonRegion>
  );
}

/** Lekce: lišta s drobečky + sloupec textu. Kopíruje obálku lesson-page. */
export function EduLessonSkeleton() {
  return (
    <SkeletonRegion className="flex flex-col lg:flex-row min-h-full">
      <div className="flex-1 min-w-0">
        <div className="border-b border-[var(--color-border-subtle)]">
          <div className="max-w-3xl mx-auto px-6 py-3"><Skeleton width="14rem" height="0.9rem" /></div>
        </div>
        <article className="max-w-3xl mx-auto px-6 py-10">
          <Skeleton width="75%" height="2.25rem" />
          <SkeletonText lines={4} style={{ marginTop: "1.5rem" }} />
          <Skeleton height="10rem" radius="0.75rem" style={{ margin: "1.5rem 0" }} />
          <SkeletonText lines={5} lastLineWidth="40%" />
        </article>
      </div>
    </SkeletonRegion>
  );
}

/** Celá edu stránka během serverového renderu (loading.tsx). */
export function EduPageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col text-foreground font-sans" style={{ background: "var(--color-background)" }}>
      <EduNavbarSkeleton />
      <div id="app" className="flex-1">{children}</div>
    </div>
  );
}
