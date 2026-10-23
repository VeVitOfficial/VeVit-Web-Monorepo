// Vykreslení bloků teorie: odstavce, seznamy, pojmy, upozornění, ilustrace a ukázky.
// Text prochází RichText (jen tučně/kurzíva, bez HTML); ukázky jsou předformátovaný text.

import type { TheoryBlock } from "@/lib/edu/aifb/theory";
import { RichText, type RichTextContext } from "./rich-text";
import { TheoryFigure } from "./theory-figures";

const CALLOUT_ICON: Record<"tip" | "warning" | "info", string> = { tip: "💡", warning: "⚠️", info: "ℹ️" };

export function TheoryBlocks({ blocks, ctx }: { blocks: TheoryBlock[]; ctx: RichTextContext }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "p":
            return <p key={index}><RichText text={block.text} ctx={ctx} /></p>;
          case "list": {
            const List = block.ordered ? "ol" : "ul";
            return (
              <div key={index} className="th-list">
                {block.title ? <p className="th-list__title">{block.title}</p> : null}
                <List className="aifb-list">
                  {block.items.map((item, i) => <li key={i}><RichText text={item} ctx={ctx} /></li>)}
                </List>
              </div>
            );
          }
          case "terms":
            return (
              <dl key={index} className="th-terms">
                {block.items.map((item) => (
                  <div key={item.term} className="th-terms__item">
                    <dt>{item.term}</dt>
                    <dd><RichText text={item.text} ctx={ctx} /></dd>
                  </div>
                ))}
              </dl>
            );
          case "callout":
            return (
              <aside key={index} className={`th-callout th-callout--${block.tone}`} aria-label={block.title}>
                <p className="th-callout__title"><span aria-hidden="true">{CALLOUT_ICON[block.tone]}</span> {block.title}</p>
                <p><RichText text={block.text} ctx={ctx} /></p>
              </aside>
            );
          case "figure":
            return (
              <figure key={index} className="th-figure">
                <TheoryFigure id={block.figure} />
                <figcaption>{block.caption}</figcaption>
              </figure>
            );
          case "example":
            return (
              <div key={index} className="th-example">
                <p className="th-example__title">{block.title}</p>
                <pre>{block.text}</pre>
              </div>
            );
        }
      })}
    </>
  );
}
