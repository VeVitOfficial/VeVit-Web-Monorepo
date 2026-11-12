import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getProduct, getProductDetails, getProducts, getVariantSiblings, productImages, type ProductSpecGroup, type StoreProduct } from "@/lib/store-data";
import { availability, discountPercent, money, priceWithoutVat } from "@/lib/store-format";
import { FREE_SHIPPING_THRESHOLD_MINOR } from "@/lib/checkout/shipping";
import { AddToCart } from "@/components/store/add-to-cart";
import { ProductCard } from "@/components/store/product-card";
import { ProductGallery } from "@/components/store/product-gallery";
import { Icon } from "@/components/store/icon";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const product = await getProduct((await params).slug);
  return product ? { title: product.name, description: product.short_desc ?? undefined } : { title: "Produkt nenalezen" };
}

/** Základní parametry, které má každý produkt, doplněné o parametry z DB (sloupec specs). */
function buildSpecs(product: StoreProduct, details: Awaited<ReturnType<typeof getProductDetails>>): ProductSpecGroup[] {
  const basic: ProductSpecGroup = {
    title: "Základní informace",
    rows: [
      product.brand ? { name: "Značka", value: product.brand } : null,
      product.store_categories?.name ? { name: "Kategorie", value: product.store_categories.name } : null,
      product.variant_label ? { name: "Varianta", value: product.variant_label } : null,
      { name: "Typ produktu", value: product.type === "digital" ? "Digitální (ke stažení)" : "Fyzický" },
      details.sku ? { name: "Kód produktu", value: details.sku } : null,
      product.type === "physical" && details.weight_grams
        ? { name: "Hmotnost balení", value: details.weight_grams >= 1000 ? `${(details.weight_grams / 1000).toLocaleString("cs-CZ")} kg` : `${details.weight_grams} g` }
        : null,
      { name: "Sazba DPH", value: `${details.vat_rate.toLocaleString("cs-CZ")} %` }
    ].filter((row): row is { name: string; value: string } => row !== null)
  };
  return [...details.specs, basic];
}

export default async function ProductPage({ params }: Props) {
  await connection();
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const [variants, details, related] = await Promise.all([
    getVariantSiblings(product),
    getProductDetails(product.id),
    product.store_categories?.slug ? getProducts({ category: product.store_categories.slug }) : Promise.resolve([])
  ]);
  const images = productImages(product);
  const currentPrice = product.sale_price ?? product.price;
  const discount = discountPercent(product.price, product.sale_price);
  const stock = availability(product);
  const specs = buildSpecs(product, details);
  const similar = related.filter((item) => item.id !== product.id && (!product.variant_group || item.variant_group !== product.variant_group)).slice(0, 8);
  const description = product.description ?? product.short_desc;
  const freeShipping = FREE_SHIPPING_THRESHOLD_MINOR / 100;

  return (
    <main className="sf-main" id="main-content">
      <nav className="sf-breadcrumbs" aria-label="Drobečková navigace">
        <Link href="/store">Obchod</Link>
        <span aria-hidden="true">›</span>
        <Link href="/store/catalog">Katalog</Link>
        {product.store_categories && (
          <>
            <span aria-hidden="true">›</span>
            <Link href={`/store/catalog?category=${encodeURIComponent(product.store_categories.slug)}`}>{product.store_categories.name}</Link>
          </>
        )}
        <span aria-hidden="true">›</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="sf-pdp">
        <ProductGallery images={images} name={product.name} badge={discount ? `−${discount} %` : null} />

        <section className="sf-pdp__info" aria-labelledby="product-title">
          {product.brand ? (
            <Link className="sf-pdp__brand" href={`/store/catalog?brand=${encodeURIComponent(product.brand)}`}>{product.brand}</Link>
          ) : null}
          <h1 id="product-title" className="sf-pdp__title">{product.name}</h1>
          <p className="sf-pdp__meta">
            {details.sku ? <span>Kód: <b>{details.sku}</b></span> : null}
            {product.store_categories ? <span>{product.store_categories.name}</span> : null}
          </p>
          {product.short_desc ? <p className="sf-pdp__lead">{product.short_desc}</p> : null}

          {variants.length > 0 && (
            <div className="sf-variants">
              <p className="sf-variants__label">Vyberte variantu <span>({variants.length + 1})</span></p>
              <div className="sf-variants__list">
                <span className="sf-variant is-current" aria-current="true">
                  {product.variant_label ?? "základní"}
                  <small>{money.format(currentPrice)}</small>
                </span>
                {variants.map((variant) => {
                  const price = variant.sale_price ?? variant.price;
                  return (
                    <Link key={variant.slug} href={`/store/product/${encodeURIComponent(variant.slug)}`} className="sf-variant" title={variant.name}>
                      {variant.variant_label ?? variant.name}
                      <small>{money.format(price)}</small>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <ul className="sf-pdp__highlights">
            <li><Icon name="local_shipping" /> Doprava zdarma nad {money.format(freeShipping)}</li>
            <li><Icon name="currency_exchange" /> Česká faktura s DPH pro firmy i školy</li>
            <li><Icon name="replay" /> 14 dní na vrácení bez udání důvodu</li>
          </ul>
        </section>

        <aside className="sf-buybox" aria-label="Nákup">
          <div className="sf-buybox__price">
            {product.sale_price !== null && (
              <p className="sf-buybox__was"><s>{money.format(product.price)}</s>{discount ? <span className="sf-badge sf-badge--sale">−{discount} %</span> : null}</p>
            )}
            <p className={`sf-buybox__now${product.sale_price !== null ? " is-sale" : ""}`}>{money.format(currentPrice)}</p>
            <p className="sf-buybox__vat">{money.format(priceWithoutVat(currentPrice, details.vat_rate))} bez DPH</p>
          </div>
          <div className={`sf-buybox__stock sf-stock sf-stock--${stock.tone}`}>
            <strong>{stock.label}</strong>
            <span>{stock.detail}</span>
          </div>
          <AddToCart product={product} image={images[0] ?? null} withQuantity disabled={!stock.buyable} />
          <ul className="sf-buybox__perks">
            {product.type === "physical" ? (
              <>
                <li><Icon name="local_shipping" /><span><b>Zásilkovna</b> výdejní místa i doručení na adresu</span></li>
                <li><Icon name="policy" /><span><b>Originální zboží</b> od ověřených distributorů</span></li>
              </>
            ) : (
              <li><Icon name="download" /><span><b>Ihned ke stažení</b> po zaplacení</span></li>
            )}
            <li><Icon name="lock" /><span><b>Bezpečná platba</b> kartou, Apple Pay i Google Pay</span></li>
          </ul>
          <Link className="sf-link" href="/store/catalog">← Zpět do katalogu</Link>
        </aside>
      </div>

      <nav className="sf-tabs" aria-label="Sekce produktu">
        <a href="#popis">Popis</a>
        <a href="#parametry">Parametry</a>
        <a href="#doprava">Doprava a vrácení</a>
        {similar.length ? <a href="#podobne">Podobné produkty</a> : null}
      </nav>

      <div className="sf-pdp-sections">
        <section id="popis" className="sf-panel" aria-labelledby="popis-title">
          <h2 id="popis-title">Popis produktu</h2>
          {description ? <p className="sf-prose">{description}</p> : <p className="sf-muted">Popis produktu připravujeme.</p>}
        </section>

        <section id="parametry" className="sf-panel" aria-labelledby="parametry-title">
          <h2 id="parametry-title">Parametry a specifikace</h2>
          <div className="sf-specs">
            {specs.map((group) => (
              <table key={group.title} className="sf-specs__table">
                <caption>{group.title}</caption>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.name}>
                      <th scope="row">{row.name}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>
        </section>

        <section id="doprava" className="sf-panel" aria-labelledby="doprava-title">
          <h2 id="doprava-title">Doprava a vrácení</h2>
          <dl className="sf-facts">
            <div><dt>Zásilkovna – výdejní místo</dt><dd>Tisíce výdejních míst a Z-BOXů po celé ČR</dd></div>
            <div><dt>Doručení na adresu</dt><dd>Kurýr Zásilkovny až k vašim dveřím</dd></div>
            <div><dt>Doprava zdarma</dt><dd>U objednávek nad {money.format(freeShipping)}</dd></div>
            <div><dt>Vrácení zboží</dt><dd>Do 14 dnů bez udání důvodu · <Link href="/cs/store/returns.php">podmínky</Link></dd></div>
          </dl>
        </section>
      </div>

      {similar.length > 0 && (
        <section id="podobne" className="sf-section" aria-labelledby="podobne-title">
          <div className="sf-section__head">
            <h2 id="podobne-title">Podobné produkty</h2>
            {product.store_categories ? <Link href={`/store/catalog?category=${encodeURIComponent(product.store_categories.slug)}`}>Celá kategorie →</Link> : null}
          </div>
          <div className="sf-rail">{similar.map((item) => <ProductCard key={item.id} product={item} />)}</div>
        </section>
      )}
    </main>
  );
}
