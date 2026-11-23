"use client";

// Zaznamená návštěvu nástroje do "Kde jste skončili" (Fáze 2, bod 4). Nic
// nerenderuje — vkládá se do src/app/tools/[tool]/page.tsx u nástrojů s
// implementací.
import { useEffect } from "react";
import { pushRecent } from "@/lib/tools-recents";

export function RecordRecent({ slug }: { slug: string }) {
  useEffect(() => { pushRecent(slug); }, [slug]);
  return null;
}
