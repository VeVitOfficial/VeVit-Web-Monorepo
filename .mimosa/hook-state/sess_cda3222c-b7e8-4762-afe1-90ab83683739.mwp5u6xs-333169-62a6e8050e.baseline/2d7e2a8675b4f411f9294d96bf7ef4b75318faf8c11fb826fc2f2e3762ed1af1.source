"use client";

// Tlačítko „Kopírovat kód“ s potvrzením textem (stav není jen ikonou).

import { useState } from "react";
import { useEduLang } from "../i18n";

export function CopyCode({ code }: { code: string }) {
  const { t } = useEduLang();
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button
        type="button"
        className="btn btn-ghost aifb-btn-sm"
        onClick={() => {
          navigator.clipboard?.writeText(code).then(() => setCopied(true), () => setCopied(false));
        }}
      >
        {t("aifb.teacher.copy")}
      </button>
      <span className="aifb-muted" role="status">{copied ? t("aifb.teacher.copied") : ""}</span>
    </>
  );
}
