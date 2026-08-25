import Image from "next/image";
import Link from "next/link";
import { productImages, type StoreProduct } from "@/lib/store-data";

const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

export function ProductCard({ product }: { product: StoreProduct }) {
  const image = productImages(product)[0];
  const price = product.sale_price ?? product.price;
  return (
    <article className="store-card">
      <Link href={`/store/product/${encodeURIComponent(product.slug)}`} className="store-card-image" aria-label={product.name}>
        {image ? (
          <Image src={image} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
        ) : (
          <span aria-hidden="true">VeVit</span>
        )}
      </Link>
      <div className="store-card-body">
        <p className="store-eyebrow">{product.store_categories?.name ?? product.type}</p>
        <h2><Link href={`/store/product/${encodeURIComponent(product.slug)}`}>{product.name}</Link></h2>
        <p>{product.short_desc ?? "Kvalitní produkt z ekosystému VeVit."}</p>
        <div className="store-card-price">
          <strong>{money.format(price)}</strong>
          {product.sale_price !== null && <s>{money.format(product.price)}</s>}
        </div>
      </div>
    </article>
  );
}
