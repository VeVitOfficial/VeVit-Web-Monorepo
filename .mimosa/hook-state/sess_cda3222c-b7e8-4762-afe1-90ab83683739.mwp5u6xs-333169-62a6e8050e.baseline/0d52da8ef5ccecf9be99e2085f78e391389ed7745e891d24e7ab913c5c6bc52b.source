"use client";

// Žák ve škole: po načtení stránky doplní do místního průběhu stavy ze serveru (jiné zařízení,
// školní počítač) a zapne odesílání dalších změn na server. Novější záznam vyhrává; hotovo se
// nikdy nepřepíše na rozpracováno.

import { useEffect } from "react";
import { enableServerSync, getProgressNow, replaceProgress } from "../aifb/use-progress";

export type ServerLessonState = { lessonId: string; status: "started" | "done"; at: string };

export function SchoolProgressSync({ csrfToken, server }: { csrfToken: string | null; server: ServerLessonState[] }) {
  useEffect(() => {
    enableServerSync(csrfToken);
    const local = getProgressNow();
    const lessons = { ...local.lessons };
    let changed = false;
    for (const row of server) {
      const mine = lessons[row.lessonId];
      const newer = !mine || (new Date(row.at).getTime() > new Date(mine.at).getTime() && !(mine.status === "done" && row.status === "started"));
      if (newer) {
        lessons[row.lessonId] = { status: row.status, at: row.at };
        changed = true;
      }
    }
    if (changed) replaceProgress({ version: 1, lessons });
    return () => enableServerSync(null);
  }, [csrfToken, server]);
  return null;
}
