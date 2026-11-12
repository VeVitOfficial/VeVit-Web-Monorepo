import Image from "next/image";
import Link from "next/link";
import { productImages, type StoreProduct } from "@/lib/store-data";
import { availability, discountPercent, money } from "@/lib/store-format";
import { AddToCart } from "@/components/store/add-to-cart";

export function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const image = productImages(product)[0];
  const price = product.sale_price ?? product.price;
  const discount = discountPercent(product.price, product.sale_price);
  const stock = availability(product);
  const href = `/store/product/${encodeURIComponent(product.slug)}`;
  return (
    <article className="sf-card">
      <Link href={href} className="sf-card__media" tabIndex={-1} aria-hidden="true">
        {image ? (
          <Image src={image} alt="" fill sizes="(max-width: 560px) 50vw, (max-width: 1024px) 33vw, 240px" priority={priority} />
        ) : (
          <span className="sf-card__placeholder">VeVit</span>
        )}
      </Link>
      <div className="sf-card__badges">
        {discount ? <span className="sf-badge sf-badge--sale">−{discount} %</span> : null}
        {product.type === "digital" ? <span className="sf-badge sf-badge--info">Digitální</span> : null}
        {(product.variant_count ?? 0) > 1 ? <span className="sf-badge">{product.variant_count} variant</span> : null}
      </div>
      <div className="sf-card__body">
        {product.brand ? <p className="sf-card__brand">{product.brand}</p> : null}
        <h3 className="sf-card__title"><Link href={href}>{product.name}</Link></h3>
        {product.short_desc ? <p className="sf-card__desc">{product.short_desc}</p> : null}
        <p className={`sf-stock sf-stock--${stock.tone}`}>{stock.label}</p>
      </div>
      <div className="sf-card__foot">
        <div className="sf-price">
          {product.sale_price !== null && <s>{money.format(product.price)}</s>}
          <strong className={product.sale_price !== null ? "is-sale" : undefined}>{money.format(price)}</strong>
        </div>
        <AddToCart product={product} image={image ?? null} compact disabled={!stock.buyable} />
      </div>
    </article>
  );
}
