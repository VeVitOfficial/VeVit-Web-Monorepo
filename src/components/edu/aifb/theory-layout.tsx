// Rozvržení textu teorie (levely AIFB i moduly online kurzu): obsah vlevo, sekce s ilustracemi
// a shrnutí. Co následuje za shrnutím (cvičení, průběh, další krok), dodává stránka jako children.

import type { ReactNode } from "react";
import type { AifbT } from "@/lib/edu/aifb/i18n";
import type { TheoryDoc } from "@/lib/edu/aifb/theory";
import { RichText, type RichTextContext } from "./rich-text";
import { TheoryBlocks } from "./theory-blocks";

export function TheoryLayout({ theory, ctx, t, children }: { theory: TheoryDoc; ctx: RichTextContext; t: AifbT; children?: ReactNode }) {
  return (
    <div className="th-layout">
      <nav className="aifb-toc th-toc aifb-noprint" aria-label={t("aifb.theory.contents")}>
        <p className="aifb-toc__title">{t("aifb.theory.contents")}</p>
        <ol>
          {theory.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.heading}</a></li>)}
          <li><a href="#shrnuti">{t("aifb.theory.summary")}</a></li>
        </ol>
      </nav>

      <article className="th-article">
        {theory.sections.map((section) => (
          <section key={section.id} id={section.id} className="th-section" aria-labelledby={`${section.id}-h`}>
            <h2 id={`${section.id}-h`}>{section.heading}</h2>
            <TheoryBlocks blocks={section.blocks} ctx={ctx} />
          </section>
        ))}

        <section id="shrnuti" className="th-summary" aria-labelledby="shrnuti-h">
          <h2 id="shrnuti-h">{t("aifb.theory.summary")}</h2>
          <ul className="aifb-list">
            {theory.summary.map((item, index) => <li key={index}><RichText text={item} ctx={ctx} /></li>)}
          </ul>
        </section>

        {children}
      </article>
    </div>
  );
}
