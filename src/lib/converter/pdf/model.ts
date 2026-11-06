// Dokumentový model mezi rekonstrukcí (layout.ts) a zápisem DOCX (docx-writer.ts).
// Jednotky: body (pt), souřadnice stránky (y dolů). Barvy hex RRGGBB.

export type Align = "left" | "center" | "right" | "both";

export interface Run {
  text: string;
  font: string;
  bold: boolean;
  italic: boolean;
  /** pt, zaokrouhleno na 0,5. */
  size: number;
  color: string;
  link?: string;
  rise: number;
}

export interface ListInfo {
  kind: "bullet" | "number";
  marker: string;
  /** Pozice značky a textu od levého okraje oblasti (pt). */
  markerX: number;
  textX: number;
  format: "bullet" | "decimal" | "lowerLetter" | "upperLetter" | "lowerRoman" | "upperRoman";
}

export interface Para {
  kind: "para";
  runs: Run[];
  align: Align;
  indLeft: number; indRight: number; indFirst: number;
  before: number; after: number;
  /** Rozteč účaří (pt) víceřádkového odstavce; null = jednořádkový. */
  line: number | null;
  top: number; bottom: number;
  /** Účaří prvního a posledního řádku (pt) — pro přesné svislé mezery. */
  firstBase?: number; lastBase?: number;
  heading?: number;
  list?: ListInfo;
  /** Převládající velikost písma (pt). */
  size?: number;
  /** Dolní ohraničení (vodorovná linka pod odstavcem). */
  borderBottom?: Border & { space: number };
  pageBreakBefore?: boolean;
  /** Zarážky tabulátoru (pt od levého okraje oblasti) pro řádky s více segmenty. */
  tabs?: { pos: number; val: "left" | "right" | "center" }[];
}

export interface Border { color: string; /** osminy bodu */ sz: number }
export interface Borders { top?: Border; bottom?: Border; left?: Border; right?: Border }

export interface TableCell {
  blocks: Block[];
  span: number;
  vMerge?: "restart" | "continue";
  shade?: string;
  borders: Borders;
  valign: "top" | "center" | "bottom";
}

export interface TableRow { cells: TableCell[]; height: number; header?: boolean; /** Horní hrana řádku (pt, stránka). */ top?: number }

export interface Table {
  kind: "table";
  x: number;
  colWidths: number[];
  rows: TableRow[];
  top: number; bottom: number;
  /** Tabulka jen pro rozvržení (bloky vedle sebe), bez ohraničení a bez stylu „Tabulka“. */
  layout: boolean;
}

export interface ImageBlock {
  kind: "image";
  x: number; y: number; w: number; h: number;
  png: Uint8Array;
  pxW: number; pxH: number;
  name: string;
  /** Plovoucí obrázek (překrývá se s textem) vs. vlastní odstavec. */
  anchored?: boolean;
}

export interface RuleBlock { kind: "rule"; color: string; sz: number; x0: number; x1: number; y: number }

/** Absolutně umístěný text (přesný režim). */
export interface FrameBlock { kind: "frame"; x: number; y: number; w: number; h: number; runs: Run[]; lineHeight: number }

/** Vektorový tvar (přesný režim): cesta v souřadnicích stránky. */
export interface ShapeBlock { kind: "shape"; x: number; y: number; w: number; h: number; d: string; fill?: string; stroke?: string; lineWidth: number }

/** Tekoucí sloupce textu (sekce Wordu se sloupci), ne bloky vedle sebe. */
export interface ColumnsBlock { kind: "columns"; x: number; widths: number[]; gap: number; cols: Block[][]; top: number; bottom: number }

export type Block = Para | Table | ImageBlock | RuleBlock | FrameBlock | ShapeBlock | ColumnsBlock;

export interface PageLayout {
  width: number; height: number;
  margins: { top: number; bottom: number; left: number; right: number };
  blocks: Block[];
  /** Přesný režim: stránka = absolutně pozicované prvky. */
  exact?: boolean;
}

export interface HeaderFooter { blocks: Block[]; pageField?: boolean; /** Vzdálenost od horního (záhlaví) / dolního (zápatí) okraje stránky, pt. */ offset?: number }

export interface DocModel {
  pages: PageLayout[];
  header?: HeaderFooter;
  footer?: HeaderFooter;
  /** Výchozí písmo stylu Normální. */
  body: { font: string; size: number; color: string };
  /** Styl nadpisů 1–3 z prvního výskytu. */
  headings: { font: string; size: number; bold: boolean; color: string }[];
  title?: string;
  lang?: string;
}
