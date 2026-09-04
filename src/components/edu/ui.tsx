"use client";

// Port edu/js/components/ui.js do Reactu + toast systém z edu/js/lib/dom.js.
// ClassNames jsou identické s legacy, aby se aplikoval public/edu/css/styles.css.
// Ikony renderujeme inline SVG (account sekce používá stejný přístup — viz
// src/components/account/account-shell.tsx), protože lucide vendor bundle
// v public/ není a nepřidáváme nové závislosti.

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { escapeHtml } from "@/lib/edu/dom";

// ── XPBadge ───────────────────────────────────────────────────────────────
// Žlutý badge „<xp> XP" s bleskem. Port XPBadge() z ui.js.

const ZAP_PATH = (
  <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
);

export function XPBadge({
  xp,
  size = "sm",
  extraClass = "",
}: {
  xp: number;
  size?: "sm" | "lg";
  extraClass?: string;
}) {
  const isSmall = size === "sm";
  const sizeCls = isSmall
    ? "text-[10px] px-1.5 py-0.5 rounded-md"
    : "text-xs px-2 py-1 rounded-lg";
  const iconCls = isSmall ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium border border-amber-500/20 whitespace-nowrap ${sizeCls} ${extraClass}`}
      style={{ color: "#f0ad4e", backgroundColor: "rgba(240,173,78,0.1)" }}
    >
      <svg
        className={iconCls}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ZAP_PATH}
      </svg>
      {xp} XP
    </span>
  );
}

// ── CircularProgress ──────────────────────────────────────────────────────
// Kruhový progress (SVG). Port CircularProgress() z ui.js.

export function CircularProgress({
  percent = 0,
  size = 90,
  stroke = 7,
  color = "#00d084",
  trackColor = "var(--color-input-bg)",
  showLabel = true,
  label = null,
}: {
  percent?: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  showLabel?: boolean;
  label?: string | null;
}) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  const labelText = label != null ? label : `${percent}%`;
  return (
    <svg
      width={size}
      height={size}
      className="rotate-[-90deg]"
      style={{ color: trackColor }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        style={{ color: trackColor }}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
      {showLabel ? (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[var(--color-text-primary)] text-[13px] font-bold"
          style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
        >
          {labelText}
        </text>
      ) : null}
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────
// Port toast() z dom.js – kontejner fixed bottom-right, auto-hide po 3s.

export type ToastType = "info" | "success" | "error";

interface ToastEntry {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    // v6 lint: setState v useEffect musí být asynchronní — zde voláme
    // z callbacku (ne z useEffect body), takže je to v pořádku.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3300);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div id="toast-container" className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
        {toasts.map((t) => {
          const color =
            t.type === "success"
              ? "border-success/40"
              : t.type === "error"
                ? "border-error/40"
                : "";
          return (
            <div
              key={t.id}
              className={`toast ${color} fade-in`}
              dangerouslySetInnerHTML={{ __html: escapeHtml(t.message) }}
            />
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast musí být volán uvnitř <ToastProvider>");
  }
  return ctx;
}