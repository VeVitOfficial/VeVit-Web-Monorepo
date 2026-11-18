// Patička EveryTool.cz (redesign dle index.html): čtyři sloupce + spodní pruh.
// Právní odkazy míří na podmínky užití a ochranu soukromí; ConsentSettingsButton
// otvírá znovu cookie lištu („Nastavení cookies“).
import { CATEGORY_ORDER, TOOLS, categoryLabel, type Locale } from "@/components/tools/registry/data";
import { ET_CATEGORY_COLORS } from "@/components/tools/et-colors";
import { termsFor, privacyFor } from "@/components/tools/terms-content";
import { ConsentSettingsButton } from "@/components/tools/consent-banner";

export interface FooterStrings {
  blurb: string;
  categories: string;
  everytool: string;
  about: string;
  premium: string;
  studio: string;
  websites: string;
  contact: string;
  copyright: string;
  languages: string;
}

export function SiteFooter({ locale, strings }: { locale: Locale; strings: FooterStrings }) {
  const base = `/${locale}/tools`;
  return (
    <footer className="site-footer et-foot">
      <div className="et-wrap">
        <div className="et-foot-grid">
          <div className="et-foot-brand">
            <span className="et-foot-logo">EveryTool<span>.cz</span></span>
            <p>{strings.blurb.replace("{count}", String(TOOLS.length))}</p>
          </div>
          <nav aria-label={strings.categories}>
            <strong>{strings.categories}</strong>
            {CATEGORY_ORDER.map((cat) => (
              <a key={cat} href={`${base}/?category=${cat}#et-katalog`}>
                <span className="et-dot" style={{ background: ET_CATEGORY_COLORS[cat] }} aria-hidden="true"></span>
                {categoryLabel(cat, locale)}
              </a>
            ))}
          </nav>
          <nav aria-label={strings.everytool}>
            <strong>{strings.everytool}</strong>
            <a href={`${base}/`}>{strings.about}</a>
            <a href={`${base}/#et-premium`}>{strings.premium}</a>
            <a href={`${base}/podminky-uziti`}>{termsFor(locale).title}</a>
            <a href={`${base}/ochrana-soukromi`}>{privacyFor(locale).title}</a>
            <ConsentSettingsButton locale={locale} />
          </nav>
          <nav aria-label={strings.studio}>
            <strong>{strings.studio}</strong>
            <a href="https://vevit.cz" rel="noopener">{strings.websites}</a>
            <a href="mailto:info@vevit.cz">{strings.contact}</a>
          </nav>
        </div>
        <div className="et-foot-b">
          <span>{strings.copyright}</span>
          <span>{strings.languages}</span>
        </div>
      </div>
    </footer>
  );
}
