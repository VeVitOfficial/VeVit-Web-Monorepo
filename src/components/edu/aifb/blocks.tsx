// Vykreslení obsahových bloků (p, heading, list, table, callout) z obsahu AIFB.
// Texty procházejí RichText (bez HTML), tabulky mají záhlaví a popisek pro čtečky.

import type { Block } from "@/lib/edu/aifb/types";
import { RichText, type RichTextContext } from "./rich-text";

export function Paragraphs({ items, ctx }: { items: string[]; ctx: RichTextContext }) {
  return (
    <>
      {items.map((text, index) => (
        <p key={index}><RichText text={text} ctx={ctx} /></p>
      ))}
    </>
  );
}

export function DataTable({ caption, header, rows }: { caption?: string; header: string[]; rows: string[][] }) {
  return (
    <div className="aifb-table-wrap" tabIndex={0} role="region" aria-label={caption}>
      <table className="aifb-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            {header.map((cell, index) => <th key={index} scope="col">{cell}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (cellIndex === 0
                ? <th key={cellIndex} scope="row">{cell}</th>
                : <td key={cellIndex}>{cell}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Blocks({ blocks, ctx, headingLevel = 3 }: { blocks: Block[]; ctx: RichTextContext; headingLevel?: 2 | 3 | 4 }) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "p":
            return <p key={index}><RichText text={block.text} ctx={ctx} /></p>;
          case "heading":
            return <Heading key={index}>{block.text}</Heading>;
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <div key={index}>
                {block.title ? <p className="aifb-list-title"><strong>{block.title}</strong></p> : null}
                <List className="aifb-list">
                  {block.items.map((item, itemIndex) => <li key={itemIndex}><RichText text={item} ctx={ctx} /></li>)}
                </List>
              </div>
            );
          }
          case "table":
            return <DataTable key={index} caption={block.caption} header={block.header} rows={block.rows} />;
          case "callout":
            return (
              <aside key={index} className="aifb-callout" role="note" aria-label={block.title}>
                <p className="aifb-callout__title">{block.title}</p>
                <Paragraphs items={block.paras} ctx={ctx} />
              </aside>
            );
        }
      })}
    </>
  );
}
