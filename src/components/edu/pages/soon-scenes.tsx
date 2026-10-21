// Roztomilé animované scény pro stránky „Již brzy" (AI gramotnost, Chemie, Historie).
// Čisté inline SVG; animace jsou v edu.css (prefix es-) a běží jen bez prefers-reduced-motion,
// jinak zůstane klidná statická scéna.

const INK = "#0f172a";

export function AiScene() {
  return (
    <svg className="es-scene" viewBox="0 0 300 300" aria-hidden="true">
      <text className="es-sym es-sym--1" x="34" y="120">{"{ }"}</text>
      <text className="es-sym es-sym--2" x="236" y="100">{"</>"}</text>
      <text className="es-sym es-sym--3" x="252" y="168">;</text>
      <text className="es-sym es-sym--4" x="26" y="176">01</text>

      <g className="es-float">
        <line x1="150" y1="46" x2="150" y2="28" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <circle className="es-pulse" cx="150" cy="24" r="7" fill="#fde047" stroke={INK} strokeWidth="2.5" />
        <rect x="96" y="70" width="9" height="24" rx="4.5" fill="#a78bfa" stroke={INK} strokeWidth="2.5" />
        <rect x="195" y="70" width="9" height="24" rx="4.5" fill="#a78bfa" stroke={INK} strokeWidth="2.5" />
        <rect x="104" y="46" width="92" height="74" rx="26" fill="#f1f5f9" stroke={INK} strokeWidth="3" />
        <rect x="114" y="60" width="72" height="44" rx="16" fill="#1e1b4b" />
        <g className="es-blink">
          <circle cx="136" cy="78" r="6" fill="#67e8f9" />
          <circle cx="164" cy="78" r="6" fill="#67e8f9" />
        </g>
        <path d="M140 90 Q150 99 160 90" stroke="#67e8f9" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="123" cy="90" r="4" fill="#f9a8d4" opacity="0.85" />
        <circle cx="177" cy="90" r="4" fill="#f9a8d4" opacity="0.85" />
        <rect x="132" y="118" width="36" height="16" fill="#e2e8f0" stroke={INK} strokeWidth="3" />
      </g>

      <rect x="52" y="132" width="196" height="108" rx="12" fill={INK} />
      <rect className="es-code es-code--1" x="68" y="148" width="86" height="8" rx="4" fill="#34d399" />
      <rect className="es-code es-code--2" x="84" y="164" width="116" height="8" rx="4" fill="#a78bfa" />
      <rect className="es-code es-code--3" x="84" y="180" width="70" height="8" rx="4" fill="#fbbf24" />
      <rect className="es-code es-code--4" x="68" y="196" width="104" height="8" rx="4" fill="#38bdf8" />
      <rect className="es-cursor" x="180" y="194" width="9" height="13" rx="2" fill="#f8fafc" />
      <rect x="32" y="240" width="236" height="14" rx="7" fill="#e2e8f0" stroke={INK} strokeWidth="3" />
      <circle className="es-hand es-hand--l" cx="112" cy="244" r="11" fill="#f1f5f9" stroke={INK} strokeWidth="3" />
      <circle className="es-hand es-hand--r" cx="188" cy="244" r="11" fill="#f1f5f9" stroke={INK} strokeWidth="3" />
    </svg>
  );
}

export function ChemistryScene() {
  return (
    <svg className="es-scene" viewBox="0 0 300 300" aria-hidden="true">
      <rect x="22" y="254" width="256" height="14" rx="7" fill="#cbd5e1" stroke={INK} strokeWidth="3" />

      {/* kádinka s bublinami */}
      <path d="M44 196 h46 v50 a8 8 0 0 1 -8 8 h-30 a8 8 0 0 1 -8 -8 z" fill="#e0f2fe" stroke={INK} strokeWidth="3" />
      <path d="M48 214 h38 v30 a5 5 0 0 1 -5 5 h-28 a5 5 0 0 1 -5 -5 z" fill="#4ade80" />
      <circle className="es-bubble es-bubble--1" cx="58" cy="236" r="4" fill="#bbf7d0" />
      <circle className="es-bubble es-bubble--2" cx="70" cy="238" r="3" fill="#bbf7d0" />
      <circle className="es-bubble es-bubble--3" cx="79" cy="236" r="4.5" fill="#bbf7d0" />

      {/* vědec */}
      <path d="M112 254 v-40 a38 38 0 0 1 76 0 v40 z" fill="#fff" stroke={INK} strokeWidth="3" />
      <path d="M150 178 v76" stroke={INK} strokeWidth="2.5" />
      <g className="es-head">
        <g className="es-hair">
          <path d="M120 158 L112 128 L134 146 Z M140 146 L146 116 L158 144 Z M164 144 L186 124 L180 158 Z" fill="#5b21b6" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
        <circle cx="150" cy="172" r="34" fill="#fcd9b6" stroke={INK} strokeWidth="3" />
        <circle className="es-soot" cx="150" cy="174" r="33" fill="#1e293b" />
        <path d="M118 170 Q150 160 182 170" stroke="#475569" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="136" cy="172" r="11" fill="#bae6fd" stroke={INK} strokeWidth="3" />
        <circle cx="164" cy="172" r="11" fill="#bae6fd" stroke={INK} strokeWidth="3" />
        <path d="M147 172 h6" stroke={INK} strokeWidth="3" />
        <g className="es-eyes">
          <circle cx="136" cy="172" r="3.5" fill={INK} />
          <circle cx="164" cy="172" r="3.5" fill={INK} />
        </g>
        <path className="es-smile" d="M141 189 Q150 198 159 189" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse className="es-mouth-o" cx="150" cy="192" rx="5" ry="6.5" fill={INK} />
      </g>

      {/* paže + baňka */}
      <path d="M180 232 Q198 222 204 200" stroke={INK} strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M180 232 Q198 222 204 200" stroke="#fff" strokeWidth="12" strokeLinecap="round" fill="none" />
      <g className="es-flask">
        <path d="M195 142 h20 v22 l17 38 a7 7 0 0 1 -6.3 10 h-41.4 a7 7 0 0 1 -6.3 -10 l17 -38 z" fill="#e0f2fe" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path className="es-liquid" d="M190 192 h30 l11 24 a5 5 0 0 1 -4.5 7 h-43 a5 5 0 0 1 -4.5 -7 z" fill="#f472b6" />
        <circle className="es-bubble es-bubble--4" cx="203" cy="212" r="4" fill="#fff" opacity="0.8" />
        <circle className="es-bubble es-bubble--5" cx="214" cy="214" r="3" fill="#fff" opacity="0.8" />
        <circle cx="205" cy="200" r="0" />
      </g>

      {/* výbuch */}
      <g className="es-boom">
        <circle className="es-puff es-puff--1" cx="205" cy="128" r="22" fill="#f8fafc" stroke={INK} strokeWidth="3" />
        <circle className="es-puff es-puff--2" cx="182" cy="112" r="17" fill="#e2e8f0" stroke={INK} strokeWidth="3" />
        <circle className="es-puff es-puff--3" cx="230" cy="110" r="18" fill="#fef3c7" stroke={INK} strokeWidth="3" />
        <path className="es-spark es-spark--1" d="M205 84 l5 12 12 -2 -9 9 7 10 -12 -4 -6 11 -2 -12 -12 -3 11 -6 z" fill="#fde047" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path className="es-spark es-spark--2" d="M254 134 l3 8 8 0 -6 5 3 8 -8 -4 -6 5 1 -8 -8 -4 8 -2 z" fill="#fb923c" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <text className="es-bum" x="226" y="78">BUM!</text>
      </g>
    </svg>
  );
}

export function HistoryScene() {
  return (
    <svg className="es-scene" viewBox="0 0 300 300" aria-hidden="true">
      <defs>
        <clipPath id="es-glass-clip">
          <path d="M72 112 H118 C118 142 100 152 98 168 C100 184 118 194 118 222 H72 C72 194 90 184 92 168 C90 152 72 142 72 112 Z" />
        </clipPath>
      </defs>
      <ellipse cx="150" cy="266" rx="116" ry="9" fill="rgba(0,0,0,0.16)" />

      <g className="es-float">
        <path d="M78 84 l8 -22 12 14 12 -18 12 18 12 -14 8 22 z" fill="#fbbf24" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="86" cy="62" r="3.5" fill="#f472b6" stroke={INK} strokeWidth="2" />
        <circle cx="110" cy="54" r="3.5" fill="#f472b6" stroke={INK} strokeWidth="2" />
        <circle cx="134" cy="62" r="3.5" fill="#f472b6" stroke={INK} strokeWidth="2" />
      </g>

      <g className="es-hg">
        <rect x="64" y="98" width="62" height="14" rx="7" fill="#b45309" stroke={INK} strokeWidth="3" />
        <rect x="64" y="222" width="62" height="14" rx="7" fill="#b45309" stroke={INK} strokeWidth="3" />
        <path d="M72 112 H118 C118 142 100 152 98 168 C100 184 118 194 118 222 H72 C72 194 90 184 92 168 C90 152 72 142 72 112 Z" fill="#fef3c7" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <g clipPath="url(#es-glass-clip)">
          <rect className="es-sand-top" x="70" y="112" width="50" height="56" fill="#fbbf24" />
          <rect className="es-sand-stream" x="93.5" y="164" width="3" height="58" fill="#f59e0b" />
          <rect className="es-sand-bot" x="70" y="168" width="50" height="54" fill="#fbbf24" />
        </g>
        <circle cx="86" cy="130" r="2.8" fill={INK} />
        <circle cx="104" cy="130" r="2.8" fill={INK} />
        <path d="M89 138 Q95 144 101 138" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      <rect x="164" y="110" width="94" height="118" rx="6" fill="#fef3c7" stroke={INK} strokeWidth="3" />
      <rect x="156" y="100" width="110" height="16" rx="8" fill="#fde68a" stroke={INK} strokeWidth="3" />
      <rect x="156" y="222" width="110" height="16" rx="8" fill="#fde68a" stroke={INK} strokeWidth="3" />
      <rect className="es-line es-line--1" x="178" y="134" width="68" height="6" rx="3" fill="#92400e" />
      <rect className="es-line es-line--2" x="178" y="152" width="68" height="6" rx="3" fill="#92400e" />
      <rect className="es-line es-line--3" x="178" y="170" width="68" height="6" rx="3" fill="#92400e" />
      <rect className="es-line es-line--4" x="178" y="188" width="52" height="6" rx="3" fill="#92400e" />
      <g className="es-quill">
        <path d="M0 0 L22 -38 Q34 -48 44 -40 Q44 -24 30 -16 Z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <path d="M0 0 L7 -11" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
