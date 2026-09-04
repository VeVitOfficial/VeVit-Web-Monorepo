import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/tools/site-header";
import { SiteFooter } from "@/components/tools/site-footer";
import { Toaster } from "@/components/tools/tool-runtime";
import { TOOL_COMPONENTS } from "@/components/tools/registry";
import {
  getTool, HUB_I18N, TOOL_UI_I18N, SUPPORTED_LOCALES, CATEGORY_COLORS, CATEGORY_LABELS,
  statusLabel, locationMeta, localizeTool, type Locale, type ToolStatus,
} from "@/components/tools/registry/data";

// Legacy CSS — className v shellu i komponentách zůstávají totožné s legacy.
import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../public/tools/assets/css/style.css";

async function readLocale(): Promise<Locale> {
  const h = (await headers()).get("x-vv-locale");
  return h && (SUPPORTED_LOCALES as readonly string[]).includes(h) ? (h as Locale) : "cs";
}

type Props = { params: Promise<{ tool: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).tool;
  const tool = getTool(slug);
  if (!tool) return { title: "Nástroj nenalezen | VeVit Tools" };
  const locale = await readLocale();
  const loc = localizeTool(tool, locale);
  return { title: `${loc.name} | VeVit Tools`, description: loc.description };
}

const STATUS_BADGE_CLASS: Record<ToolStatus, string> = {
  working: "tool-status-working",
  limited: "tool-status-limited",
  experimental: "tool-status-experimental",
  coming_soon: "tool-status-coming-soon",
  unavailable_on_wedos: "tool-status-unavailable_on_wedos",
  broken: "tool-status-broken",
};

export default async function ToolPage({ params }: Props) {
  // await connection() — stránka se staticky neprerenderuje, protože čte
  // x-vv-locale header (request-time API). generateMetadata jej čte také.
  await connection();
  const locale = await readLocale();
  const slug = (await params).tool;
  const tool = getTool(slug);
  if (!tool) notFound();

  const strings = HUB_I18N[locale] ?? HUB_I18N.cs;
  const uiStrings = TOOL_UI_I18N[locale] ?? TOOL_UI_I18N.cs;
  const color = CATEGORY_COLORS[tool.category];
  const loc = locationMeta(tool.processing_location, locale);
  const L = localizeTool(tool, locale);
  const Component = TOOL_COMPONENTS[tool.slug];
  const hasImpl = Component != null;

  return (
    <>
      <SiteHeader
        locale={locale}
        strings={{
          categories: strings.header_categories,
          newest: strings.header_newest,
          login: strings.header_login,
          login_title: strings.header_login_title,
          brand_name: "VeVit",
          brand_suffix: "Tools",
        }}
      />
      <main>
        <nav className="breadcrumb">
          <a href={`/${locale}/tools/`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
            </svg>{" "}
            {strings.header_categories}
          </a>
          <span className="sep">/</span>
          <span style={{ color }}>{CATEGORY_LABELS[tool.category]}</span>
          <span className="sep">/</span>
          <span>{L.name}</span>
        </nav>

        <div className="tool-header">
          <span className="bar" style={{ background: color }}></span>
          <h1>{L.name}</h1>
          <span
            className="loc-tag"
            style={{ borderColor: `${color}30`, color, background: `${color}10` }}
            title={loc.title}
          >{loc.label}</span>
          <span className={`loc-tag ${STATUS_BADGE_CLASS[tool.status]}`}>{statusLabel(tool.status, locale)}</span>
        </div>
        <p className="tool-desc">{L.description}</p>

        <div
          className="tool-shell glass"
          data-tool-slug={tool.slug}
          data-tool-category={tool.category}
          data-processing-location={tool.processing_location}
        >
          {hasImpl && Component ? (
            <div className="tool-tool" id="tool-root" data-tool-state="idle" aria-busy="false">
              <p className="sr-only" id="tool-live-status" role="status" aria-live="polite" aria-atomic="true">{uiStrings.state_ready}</p>
              <Component locale={locale} />
              <Toaster />
            </div>
          ) : (
            <div className="tool-placeholder tool-info-only">
              <div className="tool-info-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {tool.status === "coming_soon" ? (
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
                  ) : (
                    <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                  )}
                </svg>
              </div>
              <div>
                <p className="t">{uiStrings.state_idle}</p>
                <p>{statusLabel(tool.status, locale)}. {uiStrings.state_idle}</p>
              </div>
              {tool.note ? <p className="sr-only">{tool.note}</p> : null}
            </div>
          )}
        </div>

        <aside className="tool-trust" aria-label={strings.doc_title}>
          <div className="tool-trust-main">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {tool.processing_location === "client" ? (
                <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" /></>
              ) : tool.processing_location === "external_ai" ? (
                <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
              ) : (
                <><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></>
              )}
            </svg>
            <div>
              <strong>{strings.doc_title}</strong>
              <p>{loc.title}</p>
            </div>
          </div>
        </aside>
      </main>
      <SiteFooter locale={locale} strings={{ back: strings.footer_back, privacy: strings.footer_privacy, copyright: strings.footer_copyright }} />
    </>
  );
}