import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getProduct, productImages } from "@/lib/store-data";
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
  const image = productImages(product)[0];
  return (
    <main className="store-main">
      <div className="store-product">
        <div className="store-product-visual">{image ? <Image src={image} alt={product.name} fill priority sizes="(max-width: 850px) 100vw, 55vw" /> : null}</div>
        <section className="store-product-copy">
          <p className="store-eyebrow">{product.store_categories?.name ?? product.type}</p>
          <h1>{product.name}</h1>
          <p className="description">{product.description ?? product.short_desc}</p>
          <div className="store-card-price"><strong>{money.format(product.sale_price ?? product.price)}</strong>{product.sale_price !== null && <s>{money.format(product.price)}</s>}</div>
          <div className="store-actions"><AddToCart product={product} /><Link className="store-button" href="/store/catalog">Zpět do katalogu</Link></div>
        </section>
      </div>
    </main>
  );
}
