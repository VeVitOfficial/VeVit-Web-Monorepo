// Minimal OOXML (DOCX) writer for the converter test corpus.
// Only what the corpus needs: styles, runs, paragraphs, tables (merges, borders,
// shading, repeated header), numbering, headers/footers with PAGE fields,
// sections (columns, orientation), images, hyperlinks, bookmarks and embedded
// (obfuscated) fonts. Output is deterministic for stable fixtures.
import { zipSync, strToU8 } from "fflate";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

/** Run: text + {b,i,u,color,size(pt),font,highlight,strike,caps,spacing(twips)} */
export function r(text, o = {}) {
  const rp = [];
  if (o.style) rp.push(`<w:rStyle w:val="${o.style}"/>`);
  if (o.font) rp.push(`<w:rFonts w:ascii="${esc(o.font)}" w:hAnsi="${esc(o.font)}" w:cs="${esc(o.font)}" w:eastAsia="${esc(o.font)}"/>`);
  if (o.b) rp.push("<w:b/><w:bCs/>");
  if (o.i) rp.push("<w:i/><w:iCs/>");
  if (o.caps) rp.push("<w:caps/>");
  if (o.strike) rp.push("<w:strike/>");
  if (o.color) rp.push(`<w:color w:val="${o.color}"/>`);
  if (o.spacing) rp.push(`<w:spacing w:val="${o.spacing}"/>`);
  if (o.size) rp.push(`<w:sz w:val="${Math.round(o.size * 2)}"/><w:szCs w:val="${Math.round(o.size * 2)}"/>`);
  if (o.highlight) rp.push(`<w:highlight w:val="${o.highlight}"/>`);
  if (o.u) rp.push('<w:u w:val="single"/>');
  const rpr = rp.length ? `<w:rPr>${rp.join("")}</w:rPr>` : "";
  const parts = String(text).split("\t").map((t) => `<w:t xml:space="preserve">${esc(t)}</w:t>`);
  return `<w:r>${rpr}${parts.join("<w:tab/>")}</w:r>`;
}

export const br = (type) => (type ? `<w:r><w:br w:type="${type}"/></w:r>` : "<w:r><w:br/></w:r>");
export const field = (instr, placeholder = "1", o = {}) =>
  `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>${r(placeholder, o)}<w:r><w:fldChar w:fldCharType="end"/></w:r>`;

/** Paragraph: runs (string or array of run xml) + {style,align,before,after,line,ind:{left,right,firstLine,hanging},num:{id,lvl},keepNext,pageBreakBefore,border:{bottom:{sz,color}},shd,tabs:[{pos,val}],bookmark} */
export function p(content, o = {}) {
  const pp = [];
  if (o.style) pp.push(`<w:pStyle w:val="${o.style}"/>`);
  if (o.keepNext) pp.push("<w:keepNext/>");
  if (o.pageBreakBefore) pp.push("<w:pageBreakBefore/>");
  if (o.num) pp.push(`<w:numPr><w:ilvl w:val="${o.num.lvl ?? 0}"/><w:numId w:val="${o.num.id}"/></w:numPr>`);
  if (o.border) {
    const b = Object.entries(o.border).map(([side, v]) => `<w:${side} w:val="single" w:sz="${v.sz ?? 8}" w:space="${v.space ?? 4}" w:color="${v.color ?? "000000"}"/>`);
    pp.push(`<w:pBdr>${b.join("")}</w:pBdr>`);
  }
  if (o.shd) pp.push(`<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>`);
  if (o.tabs) pp.push(`<w:tabs>${o.tabs.map((t) => `<w:tab w:val="${t.val ?? "left"}" w:pos="${t.pos}"/>`).join("")}</w:tabs>`);
  if (o.before != null || o.after != null || o.line != null) {
    const a = [];
    if (o.before != null) a.push(`w:before="${o.before}"`);
    if (o.after != null) a.push(`w:after="${o.after}"`);
    if (o.line != null) a.push(`w:line="${o.line}" w:lineRule="auto"`);
    pp.push(`<w:spacing ${a.join(" ")}/>`);
  }
  if (o.ind) {
    const a = Object.entries(o.ind).map(([k, v]) => `w:${k}="${v}"`);
    pp.push(`<w:ind ${a.join(" ")}/>`);
  }
  if (o.align) pp.push(`<w:jc w:val="${o.align}"/>`);
  if (o.sectPr) pp.push(o.sectPr);
  const ppr = pp.length ? `<w:pPr>${pp.join("")}</w:pPr>` : "";
  const runs = Array.isArray(content) ? content.join("") : typeof content === "string" && !content.startsWith("<w:") ? r(content) : content;
  const bm = o.bookmark ? [`<w:bookmarkStart w:id="${o.bookmark.id}" w:name="${esc(o.bookmark.name)}"/>`, `<w:bookmarkEnd w:id="${o.bookmark.id}"/>`] : ["", ""];
  return `<w:p>${ppr}${bm[0]}${runs}${bm[1]}</w:p>`;
}

const border = (b) => (b ? `<w:${b.side} w:val="${b.val ?? "single"}" w:sz="${b.sz ?? 4}" w:space="0" w:color="${b.color ?? "000000"}"/>` : "");

/**
 * Table. rows: [{cells:[{content(xml paragraphs or string), span, vMerge:'restart'|'continue', shd, align, valign, borders:{top,bottom,left,right}}], header, height}]
 * o: {widths(twips[]), borders:'all'|'none'|'rows', borderColor, style, jc}
 */
export function table(rows, o = {}) {
  const widths = o.widths;
  const total = widths.reduce((a, b) => a + b, 0);
  const bc = o.borderColor ?? "000000";
  let tblBorders = "";
  if (o.borders === "all") tblBorders = ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => border({ side: s, color: bc })).join("");
  else if (o.borders === "rows") tblBorders = ["insideH", "bottom"].map((s) => border({ side: s, color: bc, sz: 6 })).join("") + ["top", "left", "right", "insideV"].map((s) => `<w:${s} w:val="nil"/>`).join("");
  else tblBorders = ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="nil"/>`).join("");
  const tblPr = `<w:tblPr>${o.style ? `<w:tblStyle w:val="${o.style}"/>` : ""}<w:tblW w:w="${total}" w:type="dxa"/>${o.jc ? `<w:jc w:val="${o.jc}"/>` : ""}<w:tblBorders>${tblBorders}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="108" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr>`;
  const grid = `<w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`;
  const trs = rows.map((row) => {
    let col = 0;
    const tcs = row.cells.map((c) => {
      const cell = typeof c === "string" ? { content: c } : c;
      const span = cell.span ?? 1;
      const w = widths.slice(col, col + span).reduce((a, b) => a + b, 0);
      col += span;
      const tcp = [`<w:tcW w:w="${w}" w:type="dxa"/>`];
      if (span > 1) tcp.push(`<w:gridSpan w:val="${span}"/>`);
      if (cell.vMerge) tcp.push(cell.vMerge === "restart" ? '<w:vMerge w:val="restart"/>' : "<w:vMerge/>");
      if (cell.borders) tcp.push(`<w:tcBorders>${Object.entries(cell.borders).map(([side, v]) => border({ side, ...v })).join("")}</w:tcBorders>`);
      if (cell.shd) tcp.push(`<w:shd w:val="clear" w:color="auto" w:fill="${cell.shd}"/>`);
      if (cell.valign) tcp.push(`<w:vAlign w:val="${cell.valign}"/>`);
      const content = cell.content == null || cell.content === "" ? p("", { align: cell.align }) : String(cell.content).startsWith("<w:") ? cell.content : p(r(cell.content, cell.run ?? {}), { align: cell.align, after: 0 });
      return `<w:tc><w:tcPr>${tcp.join("")}</w:tcPr>${content}</w:tc>`;
    });
    const trp = [];
    if (row.header) trp.push("<w:tblHeader/>");
    if (row.height) trp.push(`<w:trHeight w:val="${row.height}"/>`);
    if (row.cantSplit) trp.push("<w:cantSplit/>");
    return `<w:tr>${trp.length ? `<w:trPr>${trp.join("")}</w:trPr>` : ""}${tcs.join("")}</w:tr>`;
  });
  return `<w:tbl>${tblPr}${grid}${trs.join("")}</w:tbl>`;
}

/** Section properties. o: {w,h (twips), landscape, margins:{top,right,bottom,left,header,footer}, cols, colSpace, header:rId, footer:rId, titlePg, type} */
export function sectPr(o = {}) {
  const portrait = { w: 11906, h: 16838 }; // A4
  const w = o.landscape ? (o.h ?? portrait.h) : (o.w ?? portrait.w);
  const h = o.landscape ? (o.w ?? portrait.w) : (o.h ?? portrait.h);
  const m = { top: 1417, right: 1417, bottom: 1417, left: 1417, header: 708, footer: 708, ...o.margins };
  const parts = [];
  if (o.header) parts.push(`<w:headerReference w:type="default" r:id="${o.header}"/>`);
  if (o.footer) parts.push(`<w:footerReference w:type="default" r:id="${o.footer}"/>`);
  if (o.type) parts.push(`<w:type w:val="${o.type}"/>`);
  parts.push(`<w:pgSz w:w="${w}" w:h="${h}"${o.landscape ? ' w:orient="landscape"' : ""}/>`);
  parts.push(`<w:pgMar w:top="${m.top}" w:right="${m.right}" w:bottom="${m.bottom}" w:left="${m.left}" w:header="${m.header}" w:footer="${m.footer}" w:gutter="0"/>`);
  parts.push(`<w:cols w:space="${o.colSpace ?? 708}"${o.cols ? ` w:num="${o.cols}"` : ""}/>`);
  if (o.titlePg) parts.push("<w:titlePg/>");
  return `<w:sectPr>${parts.join("")}</w:sectPr>`;
}

/** Inline image. rId points at a media relationship; size in EMU via cm. */
export function image(rId, wCm, hCm, id, name = "Obrázek") {
  const cx = Math.round(wCm * 360000), cy = Math.round(hCm * 360000);
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${esc(name)}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${esc(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

export const hyperlink = (rId, text, o = {}) => `<w:hyperlink r:id="${rId}">${r(text, { color: "0563C1", u: true, ...o })}</w:hyperlink>`;

const STYLES = (o) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${NS}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:cs="${o.font}" w:eastAsia="${o.font}"/><w:sz w:val="${o.size * 2}"/><w:szCs w:val="${o.size * 2}"/><w:lang w:val="cs-CZ" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="${o.headFont}" w:hAnsi="${o.headFont}"/><w:b/><w:color w:val="1F3864"/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:rFonts w:ascii="${o.headFont}" w:hAnsi="${o.headFont}"/><w:b/><w:color w:val="2F5496"/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:rFonts w:ascii="${o.headFont}" w:hAnsi="${o.headFont}"/><w:b/><w:sz w:val="56"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>
<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/></w:style>
<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0563C1"/><w:u w:val="single"/></w:rPr></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`;

const NUMBERING = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering ${NS}>
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Liberation Sans" w:hAnsi="Liberation Sans"/></w:rPr></w:lvl>
<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="–"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
<w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="▪"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="2160" w:hanging="360"/></w:pPr></w:lvl>
</w:abstractNum>
<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="multilevel"/>
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
<w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%2)"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="1440" w:hanging="360"/></w:pPr></w:lvl>
<w:lvl w:ilvl="2"><w:start w:val="1"/><w:numFmt w:val="lowerRoman"/><w:lvlText w:val="%3."/><w:lvlJc w:val="right"/><w:pPr><w:ind w:left="2160" w:hanging="180"/></w:pPr></w:lvl>
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

/** ODTTF obfuscation (ECMA-376 Part 2, §15.2.13 / Part 1 §17.8.1): XOR the first 32 bytes with the reversed GUID bytes. */
export function obfuscateFont(ttf, guid) {
  const hex = guid.replace(/[{}-]/g, "");
  const key = [];
  for (let i = hex.length - 2; i >= 0; i -= 2) key.push(parseInt(hex.slice(i, i + 2), 16));
  const out = new Uint8Array(ttf);
  for (let i = 0; i < 32; i++) out[i] ^= key[i % 16];
  return out;
}

/**
 * Build a .docx. doc: {body(xml), sect(sectPr opts), font, headFont, size, headers:[xml], footers:[xml], media:[{name,data(Uint8Array),type}], links:[url], embedFonts:[{name,data,guid}], title, author}
 * Relationship ids: rIdH1.., rIdF1.., rIdImg1.., rIdL1..
 */
export function buildDocx(doc) {
  const o = { font: "Calibri", headFont: doc.headFont ?? doc.font ?? "Calibri", size: 11, ...doc };
  const files = {};
  const rels = [
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rIdNum" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
    '<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>',
    '<Relationship Id="rIdFonts" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>',
  ];
  const ct = [
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Default Extension="png" ContentType="image/png"/>',
    '<Default Extension="jpeg" ContentType="image/jpeg"/>',
    '<Default Extension="odttf" ContentType="application/vnd.openxmlformats-officedocument.obfuscatedFont"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>',
    '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>',
    '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
  ];
  (o.headers ?? []).forEach((xml, i) => {
    files[`word/header${i + 1}.xml`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}>${xml}</w:hdr>`;
    rels.push(`<Relationship Id="rIdH${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header${i + 1}.xml"/>`);
    ct.push(`<Override PartName="/word/header${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>`);
  });
  (o.footers ?? []).forEach((xml, i) => {
    files[`word/footer${i + 1}.xml`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}>${xml}</w:ftr>`;
    rels.push(`<Relationship Id="rIdF${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer${i + 1}.xml"/>`);
    ct.push(`<Override PartName="/word/footer${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>`);
  });
  (o.media ?? []).forEach((m, i) => {
    files[`word/media/${m.name}`] = m.data;
    rels.push(`<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`);
  });
  (o.links ?? []).forEach((url, i) => {
    rels.push(`<Relationship Id="rIdL${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(url)}" TargetMode="External"/>`);
  });
  const fontRels = [];
  const fontEntries = (o.embedFonts ?? []).map((f, i) => {
    files[`word/fonts/font${i + 1}.odttf`] = obfuscateFont(f.data, f.guid);
    fontRels.push(`<Relationship Id="rIdEF${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font${i + 1}.odttf"/>`);
    return `<w:font w:name="${esc(f.name)}"><w:charset w:val="EE"/><w:family w:val="${f.family ?? "auto"}"/><w:pitch w:val="variable"/><w:embedRegular r:id="rIdEF${i + 1}" w:fontKey="${f.guid}"/></w:font>`;
  });
  files["word/fontTable.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:fonts ${NS}>${fontEntries.join("")}</w:fonts>`;
  if (fontRels.length) files["word/_rels/fontTable.xml.rels"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${fontRels.join("")}</Relationships>`;
  files["word/settings.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings ${NS}>${o.embedFonts?.length ? "<w:embedTrueTypeFonts/>" : ""}<w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
  files["word/document.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${o.body}${sectPr(o.sect ?? {})}</w:body></w:document>`;
  files["word/styles.xml"] = STYLES(o);
  files["word/numbering.xml"] = NUMBERING;
  files["word/_rels/document.xml.rels"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join("")}</Relationships>`;
  files["docProps/core.xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(o.title ?? "")}</dc:title><dc:creator>${esc(o.author ?? "VeVit korpus")}</dc:creator><dc:language>cs-CZ</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">2026-11-06T00:00:00Z</dcterms:created></cp:coreProperties>`;
  files["[Content_Types].xml"] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">${ct.join("")}</Types>`;
  files["_rels/.rels"] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
  const enc = {};
  for (const [k, v] of Object.entries(files)) enc[k] = typeof v === "string" ? strToU8(v) : v;
  // Fixed mtime keeps fixtures byte-stable across runs.
  return zipSync(enc, { level: 6, mtime: new Date("2026-11-06T00:00:00Z") });
}
