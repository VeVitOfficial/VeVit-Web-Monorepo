// /edu/ai-gramotnost/milnik/[milestone]?pokus=N → boss kvíz kapitoly nebo závěrečný test.
import { connection } from "next/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { AiGramFrame } from "@/components/edu/ai-gramotnost/frame";
import { AiGramMilestone } from "@/components/edu/ai-gramotnost/milestone";

const MILESTONES = new Set(["boss-1", "boss-2", "boss-3", "boss-4", "boss-5", "final-6"]);

interface RouteProps {
  params: Promise<{ milestone: string }>;
  searchParams: Promise<{ pokus?: string | string[] }>;
}

export const metadata: Metadata = { title: "AI Gramotnost – Milník" };

export default async function AiGramMilestoneRoute({ params, searchParams }: RouteProps) {
  await connection();
  const locale = await readEduLocale();
  const { milestone } = await params;
  if (!MILESTONES.has(milestone)) notFound();
  const rawAttempt = (await searchParams).pokus;
  const attempt = Math.max(1, Math.trunc(Number(Array.isArray(rawAttempt) ? rawAttempt[0] : rawAttempt)) || 1);
  return (
    <AiGramFrame locale={locale}>
      <AiGramMilestone milestone={milestone} attempt={attempt} />
    </AiGramFrame>
  );
}
