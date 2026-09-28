// /edu/ai-gramotnost/* – vlastní design systém kurzu (scoped pod .aigram).
import type { ReactNode } from "react";
import "@/styles/ai-gramotnost.css";

export default function AiGramLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
