// React port sdíleného footeru nástrojů (tools/includes/footer.php).
// ClassName totožná s legacy, aby public/tools/assets/css/style.css styl fungoval.
import type { Locale } from "@/components/tools/registry/data";

interface Props {
  locale: Locale;
  strings: { back: string; privacy: string; copyright: string };
}

export function SiteFooter({ locale, strings }: Props) {
  return (
    <footer className="site-footer">
      <div className="bar">
        <a href={`/${locale}/home`} className="hover-fg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>{" "}
          {strings.back}
        </a>
        <span className="privacy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" />
          </svg>{" "}
          {strings.privacy}
        </span>
        <p>{strings.copyright}</p>
      </div>
    </footer>
  );
}