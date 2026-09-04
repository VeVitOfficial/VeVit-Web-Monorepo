"use client";

// Steganografie — port legacy tools/assets/js/tools/steganography.js
// LSB do RGB kanálů PNG, čistě client-side (canvas).
import { useEffect, useRef, useState } from "react";
import type { ToolComponentProps, Locale } from "@/components/tools/registry/data";
import { useToolUi, Icon, fmtSize, ProgressBar, ResultCard, toastSuccess } from "@/components/tools/tool-runtime";

type Mode = "enc" | "dec";

const LBL: Record<Locale, { local: string; enc: string; dec: string; drop: string; hint: string; secret: string; phSecret: string; encBtn: string; decBtn: string; hidden: string; outPh: string; errOnlyPng: string; errTooLarge: string; errLoad: string; errTooLong: string; errEnd: string; errBadLen: string; note: string; remove: string; okEnc: string; okDec: string }> = {
  cs: { local: "Lokální", enc: "Skrýt text", dec: "Vytáhnout text", drop: "Přetáhněte obrázek (PNG)", hint: "LSB skrývání — funguje jen na bezztrátové formáty (PNG)", secret: "Tajná zpráva", phSecret: "Text ke skrytí…", encBtn: "Skrýt a stáhnout PNG", decBtn: "Vytáhnout zprávu", hidden: "Skrytá zpráva", outPh: "Výsledek se zobrazí zde…", errOnlyPng: "Podporován pouze PNG (ztrátové formáty zprávu zničí).", errTooLarge: "Obrázek je příliš velký (max 25 MB).", errLoad: "Obrázek se nepodařilo načíst.", errTooLong: "Zpráva je příliš dlouhá pro tento obrázek (kapacita ~{cap} B).", errEnd: "Konec obrázku — zpráva nenalezena nebo je poškozená.", errBadLen: "Neplatná délka zprávy ({len}) — obrázek pravděpodobně neobsahuje skrytá data.", note: "LSB (Least Significant Bit) do RGB kanálů. Běží lokálně. PNG se překóduje přes canvas — původní metadata se nemažou, ale skrytá data zůstávají. JPEG nelze použít (ztrátová komprese zprávu zničí).", remove: "Odebrat", okEnc: "Zpráva skryta", okDec: "Zpráva extrahována" },
  en: { local: "Local", enc: "Hide text", dec: "Extract text", drop: "Drop an image (PNG)", hint: "LSB hiding — lossless formats only (PNG)", secret: "Secret message", phSecret: "Text to hide…", encBtn: "Hide and download PNG", decBtn: "Extract message", hidden: "Hidden message", outPh: "Result appears here…", errOnlyPng: "Only PNG is supported (lossy formats destroy the message).", errTooLarge: "Image is too large (max 25 MB).", errLoad: "Image failed to load.", errTooLong: "Message too long for this image (capacity ~{cap} B).", errEnd: "End of image — message not found or corrupted.", errBadLen: "Invalid message length ({len}) — the image probably contains no hidden data.", note: "LSB (Least Significant Bit) into RGB channels. Runs locally. PNG is re-encoded via canvas — original metadata is kept and hidden data remains. JPEG cannot be used (lossy compression destroys the message).", remove: "Remove", okEnc: "Message hidden", okDec: "Message extracted" },
  de: { local: "Lokal", enc: "Text verbergen", dec: "Text extrahieren", drop: "Bild ablegen (PNG)", hint: "LSB-Verbergung — nur verlustfreie Formate (PNG)", secret: "Geheime Nachricht", phSecret: "Zu verbergender Text…", encBtn: "Verbergen und PNG herunterladen", decBtn: "Nachricht extrahieren", hidden: "Verborgene Nachricht", outPh: "Ergebnis erscheint hier…", errOnlyPng: "Nur PNG wird unterstützt (verlustbehaftete Formate zerstören die Nachricht).", errTooLarge: "Bild zu groß (max 25 MB).", errLoad: "Bild konnte nicht geladen werden.", errTooLong: "Nachricht zu lang für dieses Bild (Kapazität ~{cap} B).", errEnd: "Ende des Bildes — Nachricht nicht gefunden oder beschädigt.", errBadLen: "Ungültige Nachrichtenlänge ({len}) — Bild enthält wahrscheinlich keine versteckten Daten.", note: "LSB (Least Significant Bit) in RGB-Kanäle. Läuft lokal. PNG wird über Canvas neu kodiert — Metadaten bleiben, versteckte Daten erhalten. JPEG nicht nutzbar (verlustbehaftete Kompression zerstört die Nachricht).", remove: "Entfernen", okEnc: "Nachricht verborgen", okDec: "Nachricht extrahiert" },
  es: { local: "Local", enc: "Ocultar texto", dec: "Extraer texto", drop: "Suelta una imagen (PNG)", hint: "Ocultación LSB — solo formatos sin pérdida (PNG)", secret: "Mensaje secreto", phSecret: "Texto a ocultar…", encBtn: "Ocultar y descargar PNG", decBtn: "Extraer mensaje", hidden: "Mensaje oculto", outPh: "El resultado aparece aquí…", errOnlyPng: "Solo se admite PNG (los formatos con pérdida destruyen el mensaje).", errTooLarge: "Imagen demasiado grande (máx 25 MB).", errLoad: "No se pudo cargar la imagen.", errTooLong: "Mensaje demasiado largo (capacidad ~{cap} B).", errEnd: "Fin de la imagen — mensaje no encontrado o corrupto.", errBadLen: "Longitud de mensaje inválida ({len}) — la imagen probablemente no contiene datos ocultos.", note: "LSB (Least Significant Bit) en canales RGB. Se ejecuta localmente. PNG se recodifica vía canvas — los metadatos se conservan y los datos ocultos permanecen. JPEG no se puede usar (la compresión con pérdida destruye el mensaje).", remove: "Quitar", okEnc: "Mensaje oculto", okDec: "Mensaje extraído" },
  uk: { local: "Локально", enc: "Сховати текст", dec: "Витягти текст", drop: "Перетягніть зображення (PNG)", hint: "LSB-приховування — лише формати без втрат (PNG)", secret: "Таємне повідомлення", phSecret: "Текст для приховування…", encBtn: "Сховати і завантажити PNG", decBtn: "Витягти повідомлення", hidden: "Приховане повідомлення", outPh: "Результат з'явиться тут…", errOnlyPng: "Підтримується лише PNG (формати з втратами знищують повідомлення).", errTooLarge: "Зображення завелике (макс 25 МБ).", errLoad: "Не вдалося завантажити зображення.", errTooLong: "Повідомлення завелике для цього зображення (ємність ~{cap} Б).", errEnd: "Кінець зображення — повідомлення не знайдено або пошкоджено.", errBadLen: "Неприпустима довжина повідомлення ({len}) — зображення ймовірно не містить прихованих даних.", note: "LSB (Least Significant Bit) у RGB-канали. Працює локально. PNG перекодується через canvas — метадані зберігаються, приховані дані залишаються. JPEG не підходить (стиснення з втратами знищує повідомлення).", remove: "Видалити", okEnc: "Повідомлення приховано", okDec: "Повідомлення витягнуто" },
  fr: { local: "Local", enc: "Cacher le texte", dec: "Extraire le texte", drop: "Déposez une image (PNG)", hint: "Cache LSB — formats sans perte uniquement (PNG)", secret: "Message secret", phSecret: "Texte à cacher…", encBtn: "Cacher et télécharger PNG", decBtn: "Extraire le message", hidden: "Message caché", outPh: "Le résultat apparaît ici…", errOnlyPng: "Seul le PNG est pris en charge (les formats avec perte détruisent le message).", errTooLarge: "Image trop grande (max 25 Mo).", errLoad: "Échec du chargement de l'image.", errTooLong: "Message trop long pour cette image (capacité ~{cap} o).", errEnd: "Fin de l'image — message introuvable ou corrompu.", errBadLen: "Longueur de message invalide ({len}) — l'image ne contient probablement pas de données cachées.", note: "LSB (Least Significant Bit) dans les canaux RGB. S'exécute localement. Le PNG est ré-encodé via canvas — les métadonnées sont conservées et les données cachées restent. JPEG inutilisable (la compression avec perte détruit le message).", remove: "Retirer", okEnc: "Message caché", okDec: "Message extrait" },
  sk: { local: "Lokálne", enc: "Skryť text", dec: "Vyťažiť text", drop: "Pretiahnite obrázok (PNG)", hint: "LSB skrývanie — len bezstratové formáty (PNG)", secret: "Tajná správa", phSecret: "Text na skrytie…", encBtn: "Skryť a stiahnuť PNG", decBtn: "Vyťažiť správu", hidden: "Skrytá správa", outPh: "Výsledok sa zobrazí tu…", errOnlyPng: "Podporovaný len PNG (stratové formáty správu zničia).", errTooLarge: "Obrázok je príliš veľký (max 25 MB).", errLoad: "Obrázok sa nepodarilo načítať.", errTooLong: "Správa je príliš dlhá (kapacita ~{cap} B).", errEnd: "Koniec obrázka — správa nenájdená alebo poškodená.", errBadLen: "Neplatná dĺžka správy ({len}) — obrázok pravdepodobne neobsahuje skryté dáta.", note: "LSB (Least Significant Bit) do RGB kanálov. Beží lokálne. PNG sa prekóduje cez canvas — pôvodné metadáta sa nemažú, skryté dáta zostávajú. JPEG nemožno použiť (stratová kompresia správu zničí).", remove: "Odstrániť", okEnc: "Správa skrytá", okDec: "Správa extrahovaná" },
};

function setBit(byte: number, val: number) { return (byte & 0xFE) | (val ? 1 : 0); }
function getBit(byte: number, bit: number) { return (byte >> bit) & 1; }

function encodeInto(imageData: ImageData, bytes: Uint8Array, L: typeof LBL.cs) {
  const d = imageData.data;
  const total = (4 + bytes.length) * 8;
  const cap = (d.length / 4) * 3;
  if (total > cap) throw new Error(L.errTooLong.replace("{cap}", String(Math.floor(cap / 8 - 4))));
  const stream: number[] = [];
  const len = bytes.length;
  for (let i = 0; i < 4; i++) stream.push((len >>> (24 - i * 8)) & 0xFF);
  for (let j = 0; j < bytes.length; j++) stream.push(bytes[j]);
  let bitIdx = 0;
  for (let p = 0; p < d.length && bitIdx < stream.length * 8; p += 4) {
    for (let ch = 0; ch < 3; ch++) {
      if (bitIdx >= stream.length * 8) break;
      const byteIdx = bitIdx >> 3, bitInByte = 7 - (bitIdx & 7);
      d[p + ch] = setBit(d[p + ch], getBit(stream[byteIdx], bitInByte));
      bitIdx++;
    }
  }
}

function decodeFrom(imageData: ImageData, L: typeof LBL.cs): string {
  const d = imageData.data;
  let p = 0, ch = 0;
  function readBits(n: number): number[] {
    const out: number[] = []; let got = 0;
    while (got < n) {
      if (p >= d.length) throw new Error(L.errEnd);
      out.push(d[p + ch] & 1); got++;
      ch++; if (ch > 2) { ch = 0; p += 4; }
    }
    return out;
  }
  const lenBits = readBits(32);
  let len = 0; for (let i = 0; i < 32; i++) len = (len << 1) | lenBits[i];
  len = len >>> 0;
  if (len <= 0 || len > 5 * 1024 * 1024) throw new Error(L.errBadLen.replace("{len}", String(len)));
  const msgBits = readBits(len * 8);
  const bytes = new Uint8Array(len);
  for (let b = 0; b < len; b++) { let v = 0; for (let k = 0; k < 8; k++) v = (v << 1) | msgBits[b * 8 + k]; bytes[b] = v; }
  return new TextDecoder().decode(bytes);
}

export default function Steganography({ locale }: ToolComponentProps) {
  const L = LBL[locale] ?? LBL.cs;
  const { t } = useToolUi(locale);
  const [mode, setMode] = useState<Mode>("enc");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ value: number; label: string } | null>(null);
  const [result, setResult] = useState<{ url: string; name: string; size: number } | null>(null);
  const [imgReady, setImgReady] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  useEffect(() => () => { if (imgRef.current) imgRef.current.src = ""; }, []);

  function fail(m: string) { setError(m); }
  function clearErr() { setError(""); }

  function onFiles(list: FileList | null) {
    if (!list || !list.length) return;
    clearErr();
    const f = list[0];
    if (f.type !== "image/png" && !/\.png$/i.test(f.name)) { fail(L.errOnlyPng); return; }
    if (f.size > 25 * 1024 * 1024) { fail(L.errTooLarge); return; }
    setFile(f);
    setOut("");
    setResult(null);
    const img = new Image();
    img.onload = () => Promise.resolve().then(() => setImgReady(true));
    img.onerror = () => fail(L.errLoad);
    img.src = URL.createObjectURL(f);
    imgRef.current = img;
  }

  function imgData(): { c: HTMLCanvasElement; cx: CanvasRenderingContext2D; data: ImageData } {
    const img = imgRef.current;
    if (!img) throw new Error(L.errLoad);
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const cx = c.getContext("2d")!;
    cx.drawImage(img, 0, 0);
    return { c, cx, data: cx.getImageData(0, 0, c.width, c.height) };
  }

  function onMode(m: Mode) {
    setMode(m);
    clearErr();
  }

  async function encode() {
    if (!file || !text.trim()) return;
    clearErr();
    setProgress({ value: 30, label: "Kóduji zprávu…" });
    try {
      const info = imgData();
      const bytes = new TextEncoder().encode(text);
      encodeInto(info.data, bytes, L);
      info.cx.putImageData(info.data, 0, 0);
      setProgress({ value: 80, label: "Ukládám PNG…" });
      const blob: Blob = await new Promise((resolve) => info.c.toBlob((b) => resolve(b as Blob), "image/png"));
      setProgress(null);
      if (result) URL.revokeObjectURL(result.url);
      const url = URL.createObjectURL(blob);
      setResult({ url, name: "stego.png", size: blob.size });
      toastSuccess(L.okEnc);
    } catch (e) {
      setProgress(null);
      fail(e instanceof Error ? e.message : String(e));
    }
  }

  function decode() {
    if (!file) return;
    clearErr();
    setProgress({ value: 40, label: "Dekóduji zprávu…" });
    try {
      const info = imgData();
      const msg = decodeFrom(info.data, L);
      setOut(msg);
      setProgress(null);
      toastSuccess(L.okDec);
    } catch (e) {
      setProgress(null);
      fail(e instanceof Error ? e.message : String(e));
    }
  }

  const encDisabled = mode !== "enc" || !imgReady || !text.trim();
  const decDisabled = mode !== "dec" || !imgReady;

  return (
    <div className="stack" style={{ maxWidth: "44rem", margin: "0 auto" }}>
      <div className="seg" id="sg-mode" role="tablist">
        <button type="button" className={mode === "enc" ? "active" : ""} data-mode="enc" role="tab" aria-selected={mode === "enc"} onClick={() => onMode("enc")}>{L.enc}</button>
        <button type="button" className={mode === "dec" ? "active" : ""} data-mode="dec" role="tab" aria-selected={mode === "dec"} onClick={() => onMode("dec")}>{L.dec}</button>
      </div>

      <div
        className={`dropzone${dragOver ? " dragover" : ""}`}
        id="sg-drop"
        role="button"
        tabIndex={0}
        aria-label={L.drop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
        onDragEnd={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); onFiles(e.dataTransfer.files); }}
      >
        <span className="dz-ico"><Icon name="Upload" size={28} /></span>
        <span className="dz-title">{L.drop}</span>
        <span className="dz-hint">{L.hint}</span>
        <input ref={inputRef} type="file" className="hidden" aria-hidden="true" accept="image/png" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      </div>

      <div className={`file-list${file ? "" : " hidden"}`} id="sg-list">
        {file ? (
          <div className="file-item">
            <span className="fi-ico"><Icon name="File" size={18} /></span>
            <span className="fi-meta">
              <span className="fi-name">{file.name}</span>
              <span className="fi-size">{fmtSize(file.size)}</span>
            </span>
            <button type="button" className="btn btn-ghost btn-icon-sm fi-remove" aria-label={t("remove_file", { name: file.name })} onClick={() => { setFile(null); setImgReady(false); }}>
              <Icon name="X" size={16} />
            </button>
          </div>
        ) : null}
      </div>

      <div className={mode === "enc" ? "" : " hidden"} id="sg-enc-grp">
        <div className="stack-sm">
          <label className="field-label" htmlFor="sg-text">{L.secret}</label>
          <textarea className="textarea" id="sg-text" rows={4} placeholder={L.phSecret} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-touch" id="sg-enc" type="button" disabled={encDisabled} onClick={encode}>
          <Icon name="Download" size={18} /> {L.encBtn}
        </button>
      </div>

      <div className={mode === "dec" ? "" : " hidden"} id="sg-dec-grp">
        <button className="btn btn-primary btn-touch" id="sg-dec" type="button" disabled={decDisabled} onClick={decode}>
          <Icon name="Eye" size={18} /> {L.decBtn}
        </button>
        <div className="stack-sm" style={{ marginTop: "0.75rem" }}>
          <label className="field-label">{L.hidden}</label>
          <textarea className="textarea" id="sg-out" rows={4} readOnly placeholder={L.outPh} value={out} onChange={() => {}} />
        </div>
      </div>

      {progress ? <ProgressBar value={progress.value} label={progress.label} /> : null}

      {result ? (
        <ResultCard
          title={result.name}
          sub={`${fmtSize(result.size)}`}
          downloadHref={result.url}
          downloadName={result.name}
          onReset={() => { URL.revokeObjectURL(result.url); setResult(null); }}
          locale={locale}
        />
      ) : null}

      <p className={`error-text${error ? "" : " hidden"}`} id="sg-error" role="alert">{error}</p>
      <p className="muted" style={{ fontSize: "0.8rem" }}>{L.note}</p>
    </div>
  );
}