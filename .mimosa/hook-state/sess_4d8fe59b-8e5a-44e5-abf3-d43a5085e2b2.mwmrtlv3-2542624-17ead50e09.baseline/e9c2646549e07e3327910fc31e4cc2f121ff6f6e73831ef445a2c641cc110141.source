// Animované SVG scény pro „Připravuje se" stránky nespuštěných aplikací (Mail, Office, Services, Search, Store).
// Animace jsou ve scene.css (prefix hs-) a při prefers-reduced-motion zůstane klidná statická scéna.

import type { AppId } from "./scene-data";

const INK = "#0f172a";

export function MailScene({ color }: { color: string }) {
  return (
    <svg className="hs-scene" viewBox="0 0 300 300" aria-hidden="true">
      <g className="hs-float hs-float--2">
        <rect x="196" y="40" width="64" height="44" rx="6" fill="#f1f5f9" stroke={INK} strokeWidth="3" />
        <path d="M198 44l30 22 30-22" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g className="hs-float hs-float--3">
        <rect x="40" y="64" width="56" height="38" rx="6" fill="#e2e8f0" stroke={INK} strokeWidth="3" />
        <path d="M42 68l26 19 26-19" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      </g>
      <g className="hs-float">
        <rect x="64" y="120" width="172" height="124" rx="14" fill="#f8fafc" stroke={INK} strokeWidth="3.5" />
        <path d="M68 128l82 62 82-62" fill="none" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M68 238l62-52M232 238l-62-52" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
        <circle className="hs-pulse" cx="232" cy="128" r="14" fill={color} stroke={INK} strokeWidth="3" />
        <text x="232" y="133" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff">@</text>
      </g>
    </svg>
  );
}

export function OfficeScene({ color }: { color: string }) {
  return (
    <svg className="hs-scene" viewBox="0 0 300 300" aria-hidden="true">
      <g className="hs-float">
        <rect x="70" y="40" width="160" height="210" rx="10" fill="#f8fafc" stroke={INK} strokeWidth="3.5" />
        <path d="M200 40v34h30" fill="none" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <rect x="90" y="62" width="64" height="12" rx="4" fill={color} />
        <path className="hs-type" d="M90 100h110" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path className="hs-type hs-type--2" d="M90 124h96" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
        <path className="hs-type hs-type--3" d="M90 148h104" stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none" />
        <rect x="90" y="176" width="40" height="48" rx="4" fill="#e2e8f0" stroke={INK} strokeWidth="2.5" />
        <rect x="140" y="196" width="40" height="28" rx="4" fill={color} opacity=".75" stroke={INK} strokeWidth="2.5" />
        <rect className="hs-blink" x="198" y="144" width="4" height="18" fill={INK} />
      </g>
      <g className="hs-float hs-float--2">
        <rect x="206" y="196" width="62" height="52" rx="8" fill="#e2e8f0" stroke={INK} strokeWidth="3" />
        <path d="M218 236v-14M234 236v-24M250 236v-18" stroke={color} strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function ServicesScene({ color }: { color: string }) {
  return (
    <svg className="hs-scene" viewBox="0 0 300 300" aria-hidden="true">
      <g className="hs-slide">
        <rect x="34" y="78" width="112" height="76" rx="12" fill="#f8fafc" stroke={INK} strokeWidth="3.5" />
        <path d="M52 102h60M52 122h40" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <circle cx="128" cy="140" r="8" fill={color} stroke={INK} strokeWidth="2.5" />
      </g>
      <g className="hs-slide hs-slide--2">
        <rect x="154" y="140" width="112" height="76" rx="12" fill="#e2e8f0" stroke={INK} strokeWidth="3.5" />
        <path d="M172 164h60M172 184h40" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <circle cx="250" cy="202" r="8" fill={color} stroke={INK} strokeWidth="2.5" />
      </g>
      <g className="hs-pulse">
        <circle cx="150" cy="150" r="22" fill={color} stroke={INK} strokeWidth="3.5" />
        <path d="M140 150l7 7 14-14" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function SearchScene({ color }: { color: string }) {
  return (
    <svg className="hs-scene" viewBox="0 0 300 300" aria-hidden="true">
      <g>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={56 + c * 62} y={56 + r * 62} width="50" height="50" rx="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2.5" />
          )),
        )}
        <rect x="118" y="118" width="50" height="50" rx="10" fill={color} opacity=".25" stroke={color} strokeWidth="3" />
      </g>
      <g className="hs-sweep">
        <circle cx="150" cy="140" r="44" fill="rgba(255,255,255,.35)" stroke={INK} strokeWidth="7" />
        <path d="M182 174l42 42" stroke={INK} strokeWidth="14" strokeLinecap="round" />
        <path d="M128 124a28 28 0 0 1 22-12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      </g>
      <text className="hs-pulse" x="226" y="70" fontSize="22" fontWeight="700" fill={color}>⌘K</text>
    </svg>
  );
}

export function StoreScene({ color }: { color: string }) {
  return (
    <svg className="hs-scene" viewBox="0 0 300 300" aria-hidden="true">
      <g className="hs-float hs-float--3">
        <rect x="190" y="52" width="64" height="56" rx="6" fill="#e2d6b8" stroke={INK} strokeWidth="3" />
        <path d="M190 74h64M222 52v22" stroke={INK} strokeWidth="3" fill="none" />
      </g>
      <g className="hs-float">
        <path d="M82 104h136l12 142a10 10 0 0 1-10 11H80a10 10 0 0 1-10-11z" fill={color} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M112 104V92a38 38 0 0 1 76 0v12" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="150" cy="170" r="26" fill="#f8fafc" stroke={INK} strokeWidth="3" />
        <text x="150" y="179" textAnchor="middle" fontSize="26" fontWeight="700" fill={INK}>V</text>
      </g>
      <g className="hs-float hs-float--2">
        <path d="M44 150l34-6 8 30-34 6z" fill="#f8fafc" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="62" cy="158" r="4" fill={color} />
      </g>
      <g className="hs-spin">
        <path d="M236 176l8 14 16 2-12 11 3 16-15-8-15 8 3-16-12-11 16-2z" fill="#f5d76e" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function SoonScene({ app, color }: { app: AppId; color: string }) {
  switch (app) {
    case "mail": return <MailScene color={color} />;
    case "office": return <OfficeScene color={color} />;
    case "services": return <ServicesScene color={color} />;
    case "search": return <SearchScene color={color} />;
    case "store": return <StoreScene color={color} />;
    default: return null;
  }
}
