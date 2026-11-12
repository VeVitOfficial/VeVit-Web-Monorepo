import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getProduct, getVariantSiblings, productImages } from "@/lib/store-data";
import { AddToCart } from "@/components/store/add-to-cart";

type Props = { params: Promise<{ slug: string }> };
const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

export async function generateMetadata({ params }: Props) {
  const product = await getProduct((await params).slug);
  return product ? { title: product.name, description: product.short_desc ?? undefined } : { title: "Produkt nenalezen" };
}

export default async function ProductPage({ params }: Props) {
  await connection();
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [image, variants] = await Promise.all([Promise.resolve(productImages(product)[0]), getVariantSiblings(product)]);
  const currentPrice = product.sale_price ?? product.price;
  return (
    <main className="store-main">
      <div className="store-product">
        <div className="store-product-visual">{image ? <Image src={image} alt={product.name} fill priority sizes="(max-width: 850px) 100vw, 55vw" /> : null}</div>
        <section className="store-product-copy">
          <p className="store-eyebrow">{product.store_categories?.name ?? product.type}</p>
          <h1>{product.name}</h1>
          {variants.length > 0 && (
            <div className="store-variants">
              <p className="store-variants-label">Varianty ({variants.length + 1})</p>
              <div className="store-variants-list">
                <span className="store-variant-chip is-current" aria-current="true">{product.variant_label ?? "základní"}</span>
                {variants.map((variant) => {
                  const delta = Math.round((variant.sale_price ?? variant.price) - currentPrice);
                  return (
                    <Link key={variant.slug} href={`/store/product/${encodeURIComponent(variant.slug)}`} className="store-variant-chip" title={variant.name}>
                      {variant.variant_label ?? variant.name}
                      {delta !== 0 && <small>{delta > 0 ? `+${money.format(delta)}` : `−${money.format(Math.abs(delta))}`}</small>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
          <p className="description">{product.description ?? product.short_desc}</p>
          <div className="store-card-price"><strong>{money.format(product.sale_price ?? product.price)}</strong>{product.sale_price !== null && <s>{money.format(product.price)}</s>}</div>
          <div className="store-actions"><AddToCart product={product} /><Link className="store-button" href="/store/catalog">Zpět do katalogu</Link></div>
        </section>
      </div>
    </main>
  );
}
