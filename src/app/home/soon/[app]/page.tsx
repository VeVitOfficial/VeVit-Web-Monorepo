// /home/soon/<app> → „Připravuje se" obrazovka nespuštěné aplikace (Mail, Office, Services, Search, Store).
import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SCENE_APPS, appById } from "@/components/home/scene-data";
import { sceneStrings } from "@/components/home/scene-i18n";
import { SceneIcon } from "@/components/home/scene-icon";
import { SoonScene } from "@/components/home/soon-scenes";
import { ThemeToggle } from "@/components/theme-toggle";

import "../../../../../public/assets/fonts/vevit-fonts.css";
import "@/styles/home/main.css";
import "@/styles/home/support.css";
import "@/styles/home/scene.css";

const SUPPORTED: readonly string[] = ["cs", "en", "de", "es", "uk", "fr", "sk"];

async function readLocale(): Promise<string> {
  const headerValue = (await headers()).get("x-vv-locale");
  return headerValue && SUPPORTED.includes(headerValue) ? headerValue : "cs";
}

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const { app } = await params;
  const a = appById(app);
  return { title: a ? `${a.name} – připravuje se` : "VeVit" };
}

export const viewport: Viewport = { themeColor: "#0d0d0d" };

export default async function SoonAppPage({ params }: { params: Promise<{ app: string }> }) {
  const { app } = await params;
  const a = SCENE_APPS.find((x) => x.id === app && !x.live);
  if (!a) notFound();
  const locale = await readLocale();
  const L = `/${locale}`;
  const S = sceneStrings(locale);
  const vars = { "--c": a.color } as CSSProperties;

  return (
    <div className="hs-soon" style={vars}>
      <header className="support-header">
        <div className="container support-nav">
          <span className="wordmark vv-app-brand" aria-label="VeVit Technologies">
            <a href={`${L}/home`}>VeVit</a>
            <a className="wordmark-suffix" href={`${L}/home`}>Technologies</a>
          </span>
          <nav aria-label="VeVit">
            <a href={`${L}/home`}>Home</a>
            <a href={`${L}/home#board`}>{S.boardEyebrow}</a>
          </nav>
          <div className="support-account-actions vv-app-actions">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="hs-soon-hero">
          <div className="container">
            <div className="hs-soon-grid">
              <div className="hs-soon-text">
                <span className="hs-soon-badge">
                  <SceneIcon name={a.icon} size={14} />
                  {S.soon.badge}
                </span>
                <h1 className="hs-soon-title">
                  <span>{a.name}</span>
                  <span>{S.soon.soon}.</span>
                </h1>
                <p className="hs-soon-lead">{S.soon.bodies[a.id]}</p>
                <ul className="hs-soon-points">
                  {S.soon.points[a.id].map((p) => <li key={p}>{p}</li>)}
                </ul>
                <div className="hs-soon-prog" style={{ "--p": `${a.progress}%` } as CSSProperties}>
                  <div className="hs-soon-prog-bar" />
                  <div className="hs-soon-prog-meta">
                    <span>{a.progress} % {S.soon.progress}</span>
                    <span>{a.url}</span>
                  </div>
                </div>
                <div className="hs-soon-actions">
                  <a className="btn btn-primary" href={`${L}/home`}>{S.soon.back}</a>
                  <a className="btn btn-ghost" href={`${L}/home#kontakt`}>{S.soon.notify}</a>
                </div>
              </div>
              <div className="hs-soon-art">
                <div className="hs-soon-plate">
                  <SoonScene app={a.id} color={a.color} />
                </div>
                <p className="hs-soon-caption">{S.soon.captions[a.id]}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
