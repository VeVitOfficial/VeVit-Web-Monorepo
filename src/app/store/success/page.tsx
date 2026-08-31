import Link from "next/link";
import { connection } from "next/server";
import { successOrderForPage } from "@/lib/store-order-page";
import { RequestDownloadButtons } from "@/components/store/request-download";

export const metadata = { title: "Stav objednávky — VeVit Store", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

interface SuccessOrderLike {
  orderNumber: string;
  status: string;
  totalAmount: string | null;
  canDownload: boolean;
  items: { id: number; name: string; type: string; quantity: number; unitPrice: number }[];
}

interface StatusConfig { icon: string | null; type: "pending" | "success" | "review" | "error" | "default"; title: string; desc: string }

/** Port of the $statusConfig table from store/success.php. */
const STATUS: Record<string, StatusConfig> = {
  pending: { icon: null, type: "pending", title: "Platba se zpracovává", desc: "Ověřujeme průběh platby. Tato stránka se neaktualizuje automaticky — stav zkontrolujte za chvíli nebo sledujte e-mail." },
  pending_checkout: { icon: null, type: "pending", title: "Čekáme na zahájení platby", desc: "Platební relace ještě nebyla zahájena. Vraťte se do košíku a zkuste to znovu." },
  awaiting_payment: { icon: null, type: "pending", title: "Čekáme na potvrzení platby", desc: "Platba je evidována a čekáme na její potvrzení od poskytovatele. Obvykle to trvá jen chvíli." },
  paid: { icon: "check_circle", type: "success", title: "Platba potvrzena", desc: "Vaše objednávka byla úspěšně zaplacena a je připravena ke zpracování." },
  processing: { icon: "check_circle", type: "success", title: "Objednávka se zpracovává", desc: "Vaše platba proběhla. Objednávku nyní zpracováváme." },
  shipped: { icon: "local_shipping", type: "success", title: "Objednávka odeslána", desc: "Vaše zásilka je na cestě. Sledovací číslo vám přijde e-mailem." },
  delivered: { icon: "inventory_2", type: "success", title: "Objednávka doručena", desc: "Vaše zásilka byla doručena. Děkujeme za nákup!" },
  manual_review: { icon: "policy", type: "review", title: "Objednávka čeká na ověření", desc: "Platba byla pravděpodobně přijata, ale objednávka vyžaduje ruční kontrolu. Platbu NEOPAKUJTE. Budeme vás kontaktovat e-mailem." },
  cancelled: { icon: "cancel", type: "error", title: "Objednávka zrušena", desc: "Tato objednávka byla zrušena. Kontaktujte nás, pokud si myslíte, že se jedná o chybu." },
  refunded: { icon: "currency_exchange", type: "error", title: "Platba vrácena", desc: "Platba za tuto objednávku byla vrácena. O stavu budete informováni e-mailem." },
};

const DEFAULT_STATUS: StatusConfig = { icon: "help", type: "default", title: "Stav objednávky", desc: "Stav platby je ověřován na serveru. Návrat z platební brány sám o sobě platbu nepotvrzuje." };

const money = (value: number) => value.toLocaleString("cs-CZ", { maximumFractionDigits: 0 });

export default async function SuccessPage({ searchParams }: Props) {
  await connection();
  const raw = await searchParams;
  const publicId = (Array.isArray(raw.order) ? raw.order[0] : raw.order) ?? "";
  const order = await loadSuccessOrder(publicId);
  if (order === null) {
    return <main id="main-content" className="flex-1 w-full max-w-store mx-auto px-margin py-16"><p className="font-display text-h1">Stránka nebyla nalezena.</p></main>;
  }
  const sc = STATUS[order.status] ?? DEFAULT_STATUS;
  const typeClass = sc.type === "success" ? "text-success"
    : sc.type === "review" ? "text-primary"
    : sc.type === "error" ? "text-error"
    : "text-warning";

  return (
    <main id="main-content" className="flex-1 w-full max-w-[680px] mx-auto px-margin py-12 flex flex-col gap-6">
      {/* Status header */}
      <div className="flex flex-col items-center text-center gap-5">
        <div className={`order-status-icon ${sc.type === "default" ? "pending" : sc.type}`}>
          {sc.type === "pending" ? (
            <span className="vevit-spinner" style={{ width: 36, height: 36, borderWidth: 3, color: "var(--clr-warning)" }} role="status" aria-label="Načítání" />
          ) : (
            <Icon name={sc.icon ?? "help"} className={`icon-filled text-[40px] ${typeClass}`} />
          )}
        </div>
        <div>
          <span className="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest block mb-2">
            Objednávka č. <strong className="text-primary">{order.orderNumber}</strong>
          </span>
          <h1 className="font-display text-h1 text-on-surface mb-3">{sc.title}</h1>
          <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">{sc.desc}</p>
        </div>
        {["pending", "pending_checkout", "awaiting_payment"].includes(order.status) ? (
          <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 text-warning rounded-xl px-5 py-3 text-sm">
            <Icon name="info" className="text-[18px] icon-filled flex-shrink-0" />
            Platba se ověřuje. Tuto stránku ještě nezavírejte.
          </div>
        ) : null}
        {order.status === "manual_review" ? (
          <div className="flex items-start gap-3 bg-primary/8 border border-primary/30 text-on-surface rounded-xl px-5 py-4 text-sm text-left max-w-md">
            <Icon name="warning" className="text-primary text-[18px] icon-filled flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-on-surface block mb-1">Platbu neopakujte</strong>
              <span className="text-on-surface-variant">Vaše platba mohla být přijata. Objednávku manuálně ověřujeme a budeme vás kontaktovat e-mailem.</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Order summary */}
      <section className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden" aria-labelledby="order-summary-heading">
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 id="order-summary-heading" className="font-h2 text-[18px] font-bold text-on-surface">Souhrn objednávky</h2>
        </div>
        <div className="p-6 flex flex-col gap-0">
          {order.items.map((item, index) => (
            <div key={item.id} className={`flex flex-col gap-3 py-4 ${index === order.items.length - 1 ? "" : "border-b border-outline-variant/50"}`}>
              <div className="flex justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className={`badge ${item.type === "digital" ? "badge-primary" : "badge-neutral"}`}>{item.type === "digital" ? "Digitální" : "Fyzický"}</span>
                  </div>
                  <p className="font-body-md font-semibold text-on-surface">{item.name}</p>
                  <p className="font-caption text-caption text-on-surface-variant mt-0.5">Počet: {item.quantity} ks × {money(item.unitPrice)} Kč</p>
                </div>
                <div className="font-display text-[18px] font-bold text-on-surface whitespace-nowrap">{money(item.unitPrice * item.quantity)} Kč</div>
              </div>
              {order.canDownload && item.type === "digital" ? (
                <div className="bg-primary/8 border border-primary/25 rounded-lg p-4">
                  <p className="font-body-md text-sm text-on-surface-variant mb-3">
                    <Icon name="download" className="text-primary text-[16px] icon-filled align-text-bottom" />
                    {" "}Digitální soubor je připraven ke stažení. Odkaz k jednorázovému stažení bude vygenerován po kliknutí na tlačítko.
                  </p>
                  <RequestDownloadButtons orderId={publicId} items={[{ id: item.id, product_type: item.type }]} />
                </div>
              ) : null}
            </div>
          ))}
          {order.totalAmount !== null ? (
            <div className="flex justify-between items-center pt-4 border-t border-outline-variant mt-2">
              <span className="font-mono-label text-mono-label text-on-surface-variant uppercase">Celkem</span>
              <span className="font-display text-h2 font-bold text-primary">{money(Number(order.totalAmount))} Kč</span>
            </div>
          ) : null}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/" className="btn btn-outline">
          <Icon name="home" className="text-[18px]" />
          Zpět domů
        </Link>
        <Link href="/store/catalog" className="btn btn-primary">
          <Icon name="storefront" className="text-[18px]" />
          Pokračovat v nákupu
        </Link>
      </div>
    </main>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className ?? ""}`} aria-hidden="true">{name}</span>;
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