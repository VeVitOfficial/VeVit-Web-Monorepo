"use client";

import Image from "next/image";
import { useState } from "react";

/** Galerie detailu produktu: hlavní obrázek + náhledy (Alza-style). */
export function ProductGallery({ images, name, badge }: { images: string[]; name: string; badge?: string | null }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div className="sf-gallery">
      <div className="sf-gallery__main">
        {badge ? <span className="sf-badge sf-badge--sale sf-gallery__badge">{badge}</span> : null}
        {current ? (
          <Image src={current} alt={name} fill priority sizes="(max-width: 960px) 100vw, 520px" />
        ) : (
          <span className="sf-card__placeholder">VeVit</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="sf-gallery__thumbs" role="tablist" aria-label="Obrázky produktu">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={`Obrázek ${index + 1} z ${images.length}`}
              className={`sf-gallery__thumb${index === active ? " is-active" : ""}`}
              onClick={() => setActive(index)}
            >
              <Image src={src} alt="" fill sizes="72px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
