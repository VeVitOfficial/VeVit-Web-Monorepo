// /edu/ai-gramotnost/aifb/ukazky → knihovna interaktivních komponent AIFB (jen vývoj a náhledová nasazení).
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { draftPreviewEnabled, getPupilLayer } from "@/lib/edu/aifb/content";
import { AifbFrame } from "@/components/edu/aifb/frame";
import { PupilLayerView } from "@/components/edu/aifb/interactive/pupil-layer";

export const metadata: Metadata = { title: "Ukázky komponent AIFB", robots: { index: false } };

const SHOWCASE = [
  "zs1-blok-a-cv1", "zs1-blok-a-cv4", "zs1-blok-a-teorie", "zs2-level-2-cv1", "zs2-level-1-cv2", "ss-level-2-cv1",
] as const;

export default async function AifbShowcaseRoute() {
  await connection();
  if (!draftPreviewEnabled()) notFound();
  const locale = await readEduLocale();
  return (
    <AifbFrame locale={locale}>
      <h1>Ukázky komponent AIFB (návrh)</h1>
      {SHOWCASE.map((id) => {
        const layer = getPupilLayer(id);
        if (!layer) return null;
        const categoryId = id.split("-")[0];
        return (
          <section key={id} className="aifb-section" aria-labelledby={`${id}-h`}>
            <h2 className="aifb-h2" id={`${id}-h`}>{layer.component}: {id}</h2>
            <PupilLayerView lessonId={id} categoryId={categoryId} layer={layer} ctx={{ locale, categoryId }} />
          </section>
        );
      })}
    </AifbFrame>
  );
}
