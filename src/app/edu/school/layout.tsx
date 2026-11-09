// /edu/school/* – VeVit Edu pro školy (portál žáka, učitele a správce). Design systém AIFB.
import type { ReactNode } from "react";
import "@/styles/ai-gramotnost.css";
import "@/styles/aifb.css";
import "@/styles/school.css";

export default function SchoolLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
