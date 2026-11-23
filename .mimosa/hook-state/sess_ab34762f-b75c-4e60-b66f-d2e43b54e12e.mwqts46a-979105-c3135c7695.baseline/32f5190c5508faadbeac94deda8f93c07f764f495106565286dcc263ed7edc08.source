"use client";

// Editor jedné jednotky obsahu AIFB (admin). Režim „Texty“ ukazuje každé textové pole zvlášť
// (struktura a id zůstávají), režim JSON dovolí měnit i strukturu (přidat krok, otázku, sekci).
// Server uloží jen úpravu, po které je celý dokument platný, a vrátí seznam chyb.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEduLang } from "../i18n";
import type { EduLocale } from "@/lib/edu/i18n-data";
import { postAifb } from "./api-client";
import { ViewToggle } from "./view-toggle";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

export type HistoryItem = { id: number; value: Json; note: string | null; author: string | null; createdAt: string };

/** Pole, která určují strukturu nebo odkazy; v režimu Texty jen ke čtení. */
const READONLY_KEYS = new Set(["id", "type", "order", "component", "figure", "topic", "number"]);
const STATUSES = ["draft", "reviewed", "published"];

function useLabel() {
  const { t } = useEduLang();
  return (key: string) => {
    const label = t(`aifb.edit.key.${key}`);
    return label === `aifb.edit.key.${key}` ? key : label;
  };
}

function rowsFor(text: string): number {
  return Math.min(14, Math.max(1, Math.ceil(text.length / 80) + (text.match(/\n/g)?.length ?? 0)));
}

function Field({ name, value, onChange, depth }: { name: string; value: Json; onChange: (next: Json) => void; depth: number }) {
  const { t } = useEduLang();
  const label = useLabel();
  const readonly = READONLY_KEYS.has(name);

  if (typeof value === "string") {
    if (name === "status" && STATUSES.includes(value)) {
      return (
        <label className="aifb-edit-field">
          <span className="aifb-edit-field__label">{label(name)}</span>
          <select value={value} onChange={(e) => onChange(e.target.value)}>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <span className="aifb-muted">{t("aifb.edit.statusHint")}</span>
        </label>
      );
    }
    if (readonly) {
      return (
        <p className="aifb-edit-field">
          <span className="aifb-edit-field__label">{label(name)}</span>
          <code title={t("aifb.edit.readonly")}>{value}</code>
        </p>
      );
    }
    return (
      <label className="aifb-edit-field">
        <span className="aifb-edit-field__label">{label(name)}</span>
        <textarea rows={rowsFor(value)} value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (typeof value === "number") {
    return (
      <label className="aifb-edit-field">
        <span className="aifb-edit-field__label">{label(name)}</span>
        {readonly ? <code>{value}</code> : <input type="number" value={value} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />}
      </label>
    );
  }
  if (typeof value === "boolean") {
    return (
      <label className="aifb-edit-field aifb-edit-field--inline">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span className="aifb-edit-field__label">{label(name)}</span>
      </label>
    );
  }
  if (value === null) {
    return <p className="aifb-edit-field"><span className="aifb-edit-field__label">{label(name)}</span><code>null</code></p>;
  }
  if (Array.isArray(value)) {
    const strings = value.every((item) => typeof item === "string");
    return (
      <fieldset className="aifb-edit-group" data-depth={depth}>
        <legend>{label(name)}</legend>
        {value.map((item, index) => (
          <div key={index} className="aifb-edit-item">
            {strings ? (
              <>
                <label className="aifb-edit-field">
                  <span className="aifb-edit-field__label">{t("aifb.edit.item", { n: index + 1 })}</span>
                  <textarea rows={rowsFor(item as string)} value={item as string} onChange={(e) => onChange(value.map((old, i) => (i === index ? e.target.value : old)))} />
                </label>
                <button type="button" className="btn btn-ghost aifb-btn-sm" onClick={() => onChange(value.filter((_, i) => i !== index))}>{t("aifb.edit.removeItem")}</button>
              </>
            ) : (
              <Field name={t("aifb.edit.item", { n: index + 1 })} value={item} depth={depth + 1} onChange={(next) => onChange(value.map((old, i) => (i === index ? next : old)))} />
            )}
          </div>
        ))}
        {strings ? <button type="button" className="btn btn-ghost aifb-btn-sm" onClick={() => onChange([...value, ""])}>{t("aifb.edit.add")}</button> : null}
      </fieldset>
    );
  }
  return (
    <fieldset className="aifb-edit-group" data-depth={depth}>
      <legend>{label(name)}</legend>
      <ObjectFields value={value} depth={depth + 1} onChange={onChange} />
    </fieldset>
  );
}

function ObjectFields({ value, onChange, depth }: { value: JsonObject; onChange: (next: JsonObject) => void; depth: number }) {
  return (
    <>
      {Object.entries(value).map(([key, item]) => (
        <Field key={key} name={key} value={item} depth={depth} onChange={(next) => onChange({ ...value, [key]: next })} />
      ))}
    </>
  );
}

export function ContentEditor({
  locale, doc, path, initial, edited, history, csrfToken, canSave,
}: {
  locale: EduLocale;
  doc: string;
  path: string;
  initial: JsonObject;
  edited: boolean;
  history: HistoryItem[];
  csrfToken: string | null;
  canSave: boolean;
}) {
  const { t } = useEduLang();
  const router = useRouter();
  const [value, setValue] = useState<JsonObject>(initial);
  const [mode, setMode] = useState<"fields" | "json">("fields");
  const [jsonText, setJsonText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  /** Aktuální hodnota z obou režimů (JSON se parsuje až při přepnutí nebo uložení). */
  function currentValue(): JsonObject | null {
    if (mode === "fields") return value;
    try {
      const parsed = JSON.parse(jsonText) as Json;
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("{ }");
      return parsed;
    } catch (error) {
      setErrors([t("aifb.edit.jsonError", { message: error instanceof Error ? error.message : "" })]);
      return null;
    }
  }

  function switchMode(next: "fields" | "json") {
    if (next === mode) return;
    if (next === "json") {
      setJsonText(JSON.stringify(value, null, 2));
      setMode("json");
      return;
    }
    const parsed = currentValue();
    if (parsed) {
      setValue(parsed);
      setErrors([]);
      setMode("fields");
    }
  }

  async function send(payload: Json, success: string) {
    setBusy(true);
    setErrors([]);
    setMessage("");
    const result = await postAifb("upravy", { doc, path, value: payload, note }, csrfToken);
    setBusy(false);
    if (result.ok) {
      setMessage(success);
      setNote("");
      router.refresh();
    } else if (Array.isArray(result.errors) && result.errors.length > 0) {
      setErrors(result.errors.map(String));
    } else {
      setErrors([t(result.error === "login_required" ? "aifb.edit.loginNeeded" : "aifb.edit.failed")]);
    }
  }

  async function save() {
    const next = currentValue();
    if (next) await send(next, t("aifb.edit.saved"));
  }

  async function revert() {
    if (!window.confirm(t("aifb.edit.revertConfirm"))) return;
    await send(null, t("aifb.edit.saved"));
  }

  function restore(item: HistoryItem) {
    if (item.value === null || typeof item.value !== "object" || Array.isArray(item.value)) return;
    setValue(item.value);
    setJsonText(JSON.stringify(item.value, null, 2));
    setMessage("");
  }

  return (
    <div className="aifb-editor">
      <ViewToggle
        options={[{ value: "fields", label: t("aifb.edit.mode.fields") }, { value: "json", label: t("aifb.edit.mode.json") }]}
        value={mode}
        onChange={switchMode}
        label={t("aifb.edit.title")}
      />

      {mode === "fields" ? (
        <div className="aifb-edit-fields">
          <ObjectFields value={value} depth={0} onChange={setValue} />
        </div>
      ) : (
        <label className="aifb-edit-field">
          <span className="aifb-edit-field__label">JSON</span>
          <textarea className="aifb-edit-json" rows={28} spellCheck={false} value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
        </label>
      )}

      <div className="aifb-editor__bar">
        <label className="aifb-edit-field">
          <span className="aifb-edit-field__label">{t("aifb.edit.note")}</span>
          <input type="text" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <p className="aifb-unlock__actions">
          <button type="button" className="btn btn-primary" disabled={busy || !canSave} onClick={save}>{t("aifb.edit.save")}</button>
          {edited ? <button type="button" className="btn btn-ghost" disabled={busy || !canSave} onClick={revert}>{t("aifb.edit.revert")}</button> : null}
        </p>
        {!canSave ? <p className="aifb-muted">{t("aifb.edit.loginNeeded")}</p> : null}
        <div role="status" aria-live="polite">{message ? <p className="aifb-status">{message}</p> : null}</div>
        {errors.length > 0 ? (
          <div className="aifb-callout aifb-callout--error" role="alert">
            <p className="aifb-callout__title">{t("aifb.edit.invalid")}</p>
            <ul className="aifb-list">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>
          </div>
        ) : null}
      </div>

      <section className="aifb-section" aria-labelledby="aifb-edit-history">
        <h2 className="eh-h2" id="aifb-edit-history"><span className="eh-bullet" aria-hidden="true" />{t("aifb.edit.history")}</h2>
        {history.length === 0 ? <p className="aifb-muted">{t("aifb.edit.noHistory")}</p> : (
          <ol className="aifb-student-list">
            {history.map((item) => (
              <li key={item.id}>
                <span>
                  <strong>{date.format(new Date(item.createdAt))}</strong>
                  {item.author ? ` · ${item.author}` : ""}
                  {item.value === null ? ` · ${t("aifb.edit.reverted")}` : ""}
                  {item.note ? <><br /><span className="aifb-muted">{item.note}</span></> : null}
                </span>
                {item.value !== null ? <button type="button" className="btn btn-ghost aifb-btn-sm" onClick={() => restore(item)}>{t("aifb.edit.restore")}</button> : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
