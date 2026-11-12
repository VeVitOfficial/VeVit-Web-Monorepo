"use client";

import { useState } from "react";
import Image from "next/image";

/** Jednoduchá produktová galerie: hlavní náhled + miniatury. */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className="store-product-visual" aria-label={name}>
        <span aria-hidden="true">VeVit</span>
      </div>
    );
  }
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div className="store-gallery">
      <div className="store-gallery-main">
        <Image src={current} alt={name} fill priority sizes="(max-width: 850px) 100vw, 55vw" />
      </div>
      {images.length > 1 && (
        <div className="store-gallery-thumbs" role="listbox" aria-label="Fotografie produktu">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              className={`store-gallery-thumb${index === active ? " is-active" : ""}`}
              onClick={() => setActive(index)}
              aria-selected={index === active}
              role="option"
              aria-label={`Fotografie ${index + 1}`}
            >
              <Image src={image} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
