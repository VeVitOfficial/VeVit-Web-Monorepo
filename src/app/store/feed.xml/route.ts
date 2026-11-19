import { getProductsForFeed, productImages, type StoreProduct } from "@/lib/store-data";
import { availability } from "@/lib/store-format";

/**
 * Produktový XML feed pro srovnávače (Heureka, Zboží.cz) na adrese /store/feed.xml.
 * Formát SHOP/SHOPITEM je kompatibilní s oběma. Digitální produkty se do feedu
 * nedávají (srovnávače je neakceptují) a stejně tak neprodejné položky
 * („Připravujeme", vyprodáno).
 */
export const revalidate = 3600;

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] as string);
}

/** description může obsahovat HTML; feed potřebuje prostý text. */
function plainText(value: string | null) {
  return value?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() ?? "";
}

/** Absolutní URL obrázku; relativní cesty se doplní doménou, neuhodnutelné se vynechají. */
function absoluteImage(source: string, base: string): string | null {
  if (/^https?:\/\//i.test(source)) return source;
  if (source.startsWith("/")) return new URL(source, base).toString();
  return null;
}

function tag(name: string, value: string | number | null | undefined) {
  if (value == null || value === "") return "";
  return `<${name}>${escapeXml(String(value))}</${name}>`;
}

function shopItem(product: StoreProduct, base: string) {
  const description = product.short_desc || plainText(product.description).slice(0, 512);
  // 0 = skladem, -1 = na dotaz („na objednávku", termín upřesníme e-mailem)
  const deliveryDate = product.stock == null || product.stock > 0 ? 0 : -1;
  const images = productImages(product)
    .map((source) => absoluteImage(source, base))
    .filter((source): source is string => source != null);
  const lines = [
    "  <SHOPITEM>",
    `    ${tag("ITEM_ID", product.id)}`,
    `    ${tag("PRODUCTNAME", product.name)}`,
    `    ${tag("PRODUCT", product.variant_label ? `${product.name} – ${product.variant_label}` : null)}`,
    `    ${tag("DESCRIPTION", description)}`,
    `    ${tag("URL", `${base}/product/${product.slug}`)}`,
    `    ${tag("IMGURL", images[0])}`,
    ...images.slice(1, 5).map((image) => `    ${tag("IMGURL_ALTERNATIVE", image)}`),
    `    ${tag("PRICE_VAT", (product.sale_price ?? product.price).toFixed(2))}`,
    `    ${tag("MANUFACTURER", product.brand)}`,
    `    ${tag("CATEGORYTEXT", product.store_categories?.name)}`,
    `    ${tag("GROUP_ID", product.variant_group)}`,
    `    ${tag("DELIVERY_DATE", deliveryDate)}`,
    "  </SHOPITEM>"
  ];
  return lines.filter(Boolean).join("\n");
}

export async function GET() {
  const products = await getProductsForFeed();
  const base = (process.env.STORE_APP_URL?.trim() || process.env.APP_URL?.trim() || "https://www.vevit.cz/store").replace(/\/+$/, "");
  const items = products
    .filter((product) => product.type === "physical" && availability(product).buyable)
    .map((product) => shopItem(product, base));
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<SHOP>\n${items.join("\n")}\n</SHOP>\n`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
    }
  });
}
