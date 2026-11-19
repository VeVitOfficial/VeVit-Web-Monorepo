"use client";

// Tisk a kopírování jednoho oddílu průvodce (dopis rodičům a časté otázky). Při tisku se přes
// data-atributy skryje zbytek stránky (viz @media print v aifb.css), po tisku se značky odstraní.

import { useState } from "react";
import { useEduLang } from "../i18n";

export function SectionActions({ sectionId }: { sectionId: string }) {
  const { t } = useEduLang();
  const [message, setMessage] = useState<string | null>(null);

  function printSection() {
    const section = document.getElementById(sectionId);
    const chapter = section?.closest(".aifb-guide-chapter");
    if (!section || !chapter) return;
    section.setAttribute("data-print-target", "");
    chapter.setAttribute("data-print-chapter", "");
    document.body.setAttribute("data-print-section", sectionId);
    const cleanup = () => {
      section.removeAttribute("data-print-target");
      chapter.removeAttribute("data-print-chapter");
      document.body.removeAttribute("data-print-section");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  async function copySection() {
    const text = document.getElementById(sectionId)?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setMessage(t("aifb.guide.copied"));
    } catch {
      setMessage(t("aifb.guide.copyFailed"));
    }
  }

  return (
    <div className="aifb-toolbar aifb-noprint">
      <button type="button" className="btn btn-ghost" onClick={printSection}>{t("aifb.guide.print")}</button>
      <button type="button" className="btn btn-ghost" onClick={() => void copySection()}>{t("aifb.guide.copy")}</button>
      {message ? <span className="aifb-muted" role="status">{message}</span> : null}
    </div>
  );
}
