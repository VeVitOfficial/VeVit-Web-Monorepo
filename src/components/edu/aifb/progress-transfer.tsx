"use client";

// „Můj průběh" na hubu: souhrn (hotové lekce, XP), uložení do souboru, načtení ze souboru a smazání.
// Soubor obsahuje jen verzi a stavy lekcí; při načtení se přísně ověří (viz parseProgress).

import { useRef, useState } from "react";
import { useEduLang } from "../i18n";
import {
  MAX_IMPORT_BYTES, computeXp, lessonIdsForLevel, levelProgress, parseProgress, serializeProgress,
} from "@/lib/edu/aifb/progress";
import { gemsFromXp } from "@/lib/edu/aifb/xp";
import { replaceProgress, resetProgress, useAifbProgress } from "./use-progress";

export function ProgressTransfer({ levels }: { levels: { id: string; lessonCount: number }[] }) {
  const { t } = useEduLang();
  const progress = useAifbProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const withIds = levels.map((level) => ({ lessonIds: lessonIdsForLevel(level.id, level.lessonCount) }));
  const total = withIds.reduce((sum, level) => sum + level.lessonIds.length, 0);
  const done = withIds.reduce((sum, level) => sum + levelProgress(progress, level.lessonIds).done, 0);
  const xp = computeXp(progress, withIds);

  function exportFile() {
    const blob = new Blob([serializeProgress(progress)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aifb-prubeh.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    const parsed = file.size <= MAX_IMPORT_BYTES ? parseProgress(await file.text()) : null;
    if (fileRef.current) fileRef.current.value = "";
    if (!parsed) {
      setMessage({ ok: false, text: t("aifb.progress.importError") });
      return;
    }
    if (!window.confirm(t("aifb.progress.importConfirm"))) return;
    replaceProgress(parsed);
    setMessage({ ok: true, text: t("aifb.progress.importOk") });
  }

  return (
    <div className="aifb-transfer">
      <p className="aifb-lead">{t("aifb.progress.lead")}</p>
      <p className="aifb-chips">
        <span className="aifb-badge">{t("aifb.progress.summary", { done, total })}</span>
        <span className="aifb-badge">{t("aifb.progress.xp", { xp })}</span>
        <span className="aifb-badge">{t("aifb.progress.gems", { gems: gemsFromXp(xp) })}</span>
      </p>
      <div className="aifb-toolbar">
        <button type="button" className="btn btn-ghost" onClick={exportFile}>{t("aifb.progress.export")}</button>
        <label className="btn btn-ghost aifb-file">
          {t("aifb.progress.import")}
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} />
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm(t("aifb.progress.resetConfirm"))) {
              resetProgress();
              setMessage(null);
            }
          }}
        >
          {t("aifb.progress.reset")}
        </button>
      </div>
      {message ? <p className={message.ok ? "aifb-muted" : "aifb-error"} role={message.ok ? "status" : "alert"}>{message.text}</p> : null}
    </div>
  );
}
