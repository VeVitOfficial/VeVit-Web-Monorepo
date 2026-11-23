// QR kód přes qrcode-generator (líně načtený UMD) → PNG s tichou zónou. Vše lokálně.
import { loadScript } from "@/components/tools/tool-runtime";

interface QrInstance { addData(text: string): void; make(): void; getModuleCount(): number; isDark(r: number, c: number): boolean }
type QrCtor = (typeNumber: number, errorCorrectionLevel: string) => QrInstance;

export async function qrPngDataUrl(text: string, scale = 6, margin = 2): Promise<string | null> {
  try {
    await loadScript("/tools/assets/js/lib/qrcode-generator.min.js");
    const make = (window as unknown as { qrcode?: QrCtor }).qrcode;
    if (!make) return null;
    const qr = make(0, "M");
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const size = (count + margin * 2) * scale;
    const c = document.createElement("canvas");
    c.width = size; c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";
    for (let r = 0; r < count; r++) for (let col = 0; col < count; col++) if (qr.isDark(r, col)) ctx.fillRect((col + margin) * scale, (r + margin) * scale, scale, scale);
    return c.toDataURL("image/png");
  } catch { return null; }
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.split(",")[1] ?? "");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
