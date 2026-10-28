/**
 * Banner „VeVit stojí za svobodnými veřejnoprávními médii“.
 * Vkládá se hned pod hlavičku každé stránky. Fotografie: Skot, CC BY-SA 4.0 (Wikimedia Commons),
 * demonstrace Ruce pryč od médií, Staroměstské náměstí, 25. 10. 2026. Styly: globals.css (.fm-*).
 */
export function FreeMediaBanner() {
  return (
    <aside className="fm-banner" aria-labelledby="fm-title">
      <div className="fm-bg" aria-hidden="true">
        <div className="fm-photo">
          <picture>
            <source media="(max-width: 720px)" srcSet="/assets/shared/free-media-sm.jpg" />
            <img src="/assets/shared/free-media.jpg" alt="" width={1600} height={683} decoding="async" />
          </picture>
        </div>
        <div className="fm-flow">
<svg viewBox="0 0 1200 240" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="fm-sheen" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0"/><stop offset=".5" stopColor="#fff" stopOpacity=".16"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
            </defs>
            <g>
              <rect x="0" y="0" width="330" height="120" fill="#fff"/>
              <rect x="0" y="120" width="330" height="120" fill="#d7141a"/>
              <polygon points="0,0 190,120 0,240" fill="#11457e"/>
            </g>
            <path className="fm-wave" fill="#fff" d="M320 0 C450 0 520 46 660 34 S940 -6 1210 26 L1210 98 C940 120 800 70 660 92 S450 122 320 122 Z"/>
            <path className="fm-wave" fill="#d7141a" d="M320 118 C450 118 530 152 670 138 S940 100 1210 132 L1210 178 C940 196 800 150 670 172 S450 190 320 186 Z"/>
            <path className="fm-wave" fill="#11457e" d="M150 150 C250 190 400 150 500 196 S820 222 1210 176 L1210 240 L60 240 C80 208 110 172 150 150 Z"/>
            <rect x="0" y="0" width="1200" height="240" fill="url(#fm-sheen)"/>
          </svg>
        </div>
        <div className="fm-shade" />
      </div>
      <div className="fm-inner">
        <p className="fm-title" id="fm-title">
          VeVit Technologies a celý VeVit Team stojí za svobodnými veřejnoprávními médii.
        </p>
        <p className="fm-joke">Ve 4:36 u nás nasazujeme nové verze aplikací. Lidi ani klienty nevyhazujeme.</p>
      </div>
      <p className="fm-credit">
        Foto: Skot,{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:Demonstrace_Ruce_pry%C4%8D_od_m%C3%A9di%C3%AD_(Starom%C4%9Bstsk%C3%A9_n%C3%A1m%C4%9Bst%C3%AD,_2026-10-25)_02.jpg"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY-SA 4.0
        </a>
        , Wikimedia Commons
      </p>
    </aside>
  );
}
