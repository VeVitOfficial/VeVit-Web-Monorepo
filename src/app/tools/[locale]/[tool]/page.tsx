import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/tools/site-header";
import { SiteFooter } from "@/components/tools/site-footer";
import { Toaster } from "@/components/tools/tool-runtime";
import { RecordRecent } from "@/components/tools/record-recent";
import { ToolIcon } from "@/components/tools/tool-icons";
import { ToolHost } from "@/components/tools/tool-host";
import {
  getTool, TOOLS, HUB_I18N, TOOL_UI_I18N, SUPPORTED_LOCALES, CATEGORY_COLORS, CATEGORY_LABELS,
  statusLabel, locationMeta, localizeTool, reverseSlug, type Locale, type ToolStatus,
} from "@/components/tools/registry/data";
import { toolAlternates } from "@/lib/tools-seo";

// Legacy CSS — className v shellu i komponentách zůstávají totožné s legacy.
import "../../../../../public/assets/fonts/vevit-fonts.css";
import "@/styles/tools.css";
// Přepínač aplikací (data-vevit-app-switcher) — stejné styly jako ostatní aplikace.
import "../../../../../public/assets/shared/app-switcher.css";

async function readLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const h = (await params).locale;
  return (SUPPORTED_LOCALES as readonly string[]).includes(h) ? (h as Locale) : "cs";
}

type Props = { params: Promise<{ locale: string; tool: string }> };

// Všechny nástroje × jazyky se předgenerují při buildu (locale dodává layout [locale]).
export function generateStaticParams() {
  return TOOLS.map((tool) => ({ tool: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).tool;
  const tool = getTool(slug);
  if (!tool) return { title: "Nástroj nenalezen | VeVit Tools" };
  const locale = await readLocale(params);
  const loc = localizeTool(tool, locale);
  return {
    title: `${loc.name} | VeVit Tools`,
    description: loc.description,
    alternates: toolAlternates(locale, `tools/${slug}`),
  };
}

const STATUS_BADGE_CLASS: Record<ToolStatus, string> = {
  working: "tool-status-working",
  limited: "tool-status-limited",
  experimental: "tool-status-experimental",
  coming_soon: "tool-status-coming-soon",
  broken: "tool-status-broken",
  maintenance: "tool-status-maintenance",
};

/** „A → B“: šipka je odkaz na opačný převod („B → A“), pokud takový nástroj existuje. */
function titleWithSwap(name: string, reverse: string | undefined, locale: Locale, label: string) {
  const i = name.indexOf("→");
  const target = reverse ? getTool(reverse) : undefined;
  if (i < 0 || !target) return name;
  return (
    <>
      {name.slice(0, i).trimEnd()}{" "}
      <a className="swap-arrow" href={`/${locale}/tools/${target.slug}`} title={`${label}: ${localizeTool(target, locale).name}`} aria-label={`${label}: ${localizeTool(target, locale).name}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></svg>
      </a>{" "}
      {name.slice(i + 1).trimStart()}
    </>
  );
}

export default async function ToolPage({ params }: Props) {
  const locale = await readLocale(params);
  const slug = (await params).tool;
  const tool = getTool(slug);
  if (!tool) notFound();

  const strings = HUB_I18N[locale] ?? HUB_I18N.cs;
  const uiStrings = TOOL_UI_I18N[locale] ?? TOOL_UI_I18N.cs;
  const color = CATEGORY_COLORS[tool.category];
  const loc = locationMeta(tool.processing_location, locale);
  const L = localizeTool(tool, locale);
  // V údržbě: nástroj se nespouští, jen informace (i když implementace existuje).
  const maintenance = tool.status === "maintenance";

  return (
    <>
      <SiteHeader
        locale={locale}
        strings={{
          categories: strings.header_categories,
          login: strings.header_login,
          login_title: strings.header_login_title,
          brand_name: "VeVit",
          brand_suffix: "Tools",
        }}
      />
      {/* Stejná obálka jako legacy tools.php (main.main > .tool-page): okraje a max šířka. */}
      {/* suppressHydrationWarning: rozšíření prohlížeče vkládají atributy do <main> před hydratací. */}
      <main className="main tool-page" suppressHydrationWarning>
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
          <span className="tool-icon" style={{ background: `color-mix(in srgb, ${color} 10%, transparent)`, color }}><ToolIcon name={tool.icon} size={22} /></span>
          <h1>{titleWithSwap(L.name, reverseSlug(tool.slug), locale, uiStrings.swap_direction)}</h1>
          <span
            className="loc-tag"
            style={{ borderColor: `color-mix(in srgb, ${color} 19%, transparent)`, color, background: `color-mix(in srgb, ${color} 6%, transparent)` }}
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
          <ToolHost
            slug={tool.slug}
            locale={locale}
            disabled={maintenance}
            readyLabel={uiStrings.state_ready}
            fallback={
            <div className="tool-placeholder tool-info-only">
              <div className="tool-info-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {maintenance ? (
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
                  ) : tool.status === "coming_soon" ? (
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
                  ) : (
                    <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                  )}
                </svg>
              </div>
              <div>
                <p className="t">{maintenance ? statusLabel(tool.status, locale) : uiStrings.state_idle}</p>
                <p>{maintenance ? uiStrings.maintenance_note : `${statusLabel(tool.status, locale)}. ${uiStrings.state_idle}`}</p>
              </div>
              {tool.note ? <p className="sr-only">{tool.note}</p> : null}
            </div>
            }
          >
            <Toaster />
            <RecordRecent slug={tool.slug} />
          </ToolHost>
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
      <SiteFooter locale={locale} strings={{ back: strings.footer_back, privacy: loc.title, copyright: strings.footer_copyright }} />
    </>
  );
}