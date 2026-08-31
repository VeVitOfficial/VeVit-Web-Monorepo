import Link from "next/link";
import { connection } from "next/server";
import { successOrderForPage } from "@/lib/store-order-page";
import { RequestDownloadButtons } from "@/components/store/request-download";

export const metadata = { title: "Stav objednávky — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Port of store/success.php's status table. */
const STATUS: Record<string, { title: string; desc: string }> = {
  pending: { title: "Platba se zpracovává", desc: "Ověřujeme průběh platby. Tato stránka se neaktualizuje automaticky — stav zkontrolujte za chvíli nebo sledujte e-mail." },
  pending_checkout: { title: "Čekáme na zahájení platby", desc: "Platební relace ještě nebyla zahájena. Vraťte se do košíku a zkuste to znovu." },
  awaiting_payment: { title: "Čekáme na potvrzení platby", desc: "Platba je evidována a čekáme na její potvrzení od poskytovatele. Obvykle to trvá jen chvíli." },
  paid: { title: "Platba potvrzena", desc: "Vaše objednávka byla úspěšně zaplacena a je připravena ke zpracování." },
  processing: { title: "Objednávka se zpracovává", desc: "Vaše platba proběhla. Objednávku nyní zpracováváme." },
  shipped: { title: "Objednávka odeslána", desc: "Vaše zásilka je na cestě. Sledovací číslo vám přijde e-mailem." },
  delivered: { title: "Objednávka doručena", desc: "Vaše zásilka byla doručena. Děkujeme za nákup!" },
  manual_review: { title: "Objednávka čeká na ověření", desc: "Platba byla pravděpodobně přijata, ale objednávka vyžaduje ruční kontrolu. Platbu NEOPAKUJTE. Budeme vás kontaktovat e-mailem." },
  cancelled: { title: "Objednávka zrušena", desc: "Tato objednávka byla zrušena. Kontaktujte nás, pokud si myslíte, že se jedná o chybu." },
  refunded: { title: "Platba vrácena", desc: "Platba za tuto objednávku byla vrácena. O stavu budete informováni e-mailem." },
};

const DEFAULT_STATUS = { title: "Stav objednávky", desc: "Stav platby je ověřován na serveru. Návrat z platební brány sám o sobě platbu nepotvrzuje." };

const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

interface SuccessOrderLike {
  orderNumber: string;
  status: string;
  totalAmount: string | null;
  canDownload: boolean;
  items: { id: number; name: string; type: string; quantity: number; unitPrice: number }[];
}

export default async function SuccessPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const publicId = (Array.isArray(raw.order) ? raw.order[0] : raw.order) ?? "";
  const order = await loadSuccessOrder(publicId);
  if (order === null) {
    return <main className="store-main store-empty"><h1>Stránka nebyla nalezena.</h1><Link className="store-button" href="/store">Zpět domů</Link></main>;
  }
  const status = STATUS[order.status] ?? DEFAULT_STATUS;
  const isPending = ["pending", "pending_checkout", "awaiting_payment"].includes(order.status);
  const isManualReview = order.status === "manual_review";
  return (
    <main className="store-main">
      <section className="store-hero">
        <p className="store-eyebrow">Objednávka č. {order.orderNumber}</p>
        <h1>{status.title}</h1>
        <p>{status.desc}</p>
        {isPending ? <p className="store-error">Platba se ověřuje. Tuto stránku ještě nezavírejte.</p> : null}
        {isManualReview ? <p className="store-error"><strong>Platbu neopakujte</strong> — vaše platba mohla být přijata. Objednávku manuálně ověřujeme a budeme vás kontaktovat e-mailem.</p> : null}
      </section>
      <div className="store-section-head"><h2>Souhrn objednávky</h2></div>
      <section className="store-form">
        {order.items.map((item) => (
          <article className="store-cart-item" key={item.id}>
            <div>
              <p className="store-eyebrow">{item.type === "digital" ? "Digitální" : "Fyzický"}</p>
              <h2>{item.name}</h2>
              <span>{item.quantity} ks × {money.format(item.unitPrice)}</span>
            </div>
            <strong>{money.format(item.unitPrice * item.quantity)}</strong>
          </article>
        ))}
        <RequestDownloadButtons orderId={publicId} items={order.canDownload ? order.items.map((item) => ({ id: item.id, product_type: item.type })) : []} />
        {order.totalAmount !== null ? <div className="store-section-head"><span>Celkem</span> <strong>{money.format(Number(order.totalAmount))}</strong></div> : null}
      </section>
      <div className="store-actions">
        <Link className="store-button" href="/">Zpět domů</Link>
        <Link className="store-button primary" href="/store/catalog">Pokračovat v nákupu</Link>
      </div>
    </main>
  );
}

interface ItemRow { id: number; product_name: unknown; product_type: unknown; quantity: unknown; unit_price: unknown }

async function loadSuccessOrder(publicId: string): Promise<SuccessOrderLike | null> {
  try {
    const order = await successOrderForPage(publicId);
    const items = order.items as unknown as ItemRow[];
    const isPaid = ["paid", "processing", "shipped", "delivered"].includes(order.status);
    const canRequestDownloads = order.payment_status === "paid" && order.status !== "manual_review" && isPaid;
    return {
      orderNumber: order.order_number,
      status: order.status ?? "",
      totalAmount: order.total_amount ?? null,
      canDownload: canRequestDownloads,
      items: items.map((item) => ({
        id: item.id,
        name: typeof item.product_name === "string" ? item.product_name : "",
        type: typeof item.product_type === "string" ? item.product_type : "physical",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
      })),
    };
  } catch {
    return null;
  }
}