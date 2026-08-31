import Link from "next/link";

export const metadata = { title: "Platba zrušena — VeVit Store", robots: { index: false } };

/** Port of store/cancel.php. */
export default function CancelPage() {
  return (
    <main className="flex-1 w-full max-w-[560px] mx-auto px-margin py-16 flex flex-col items-center text-center gap-6">
      <div className="order-status-icon error">
        <span className="material-symbols-outlined icon-filled text-[40px] text-error" aria-hidden="true">cancel</span>
      </div>

      <div>
        <span className="font-mono-label text-mono-label text-on-surface-variant uppercase tracking-widest block mb-2">Checkout</span>
        <h1 className="font-display text-h1 text-on-surface mb-3">Platba byla zrušena</h1>
        <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">
          Tvá objednávka nebyla dokončena. Obsah košíku zůstal uložen — můžeš to zkusit znovu nebo si nechat čas na rozmyšlenou.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link href="/store/cart" className="btn btn-outline">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">shopping_bag</span>
          Zpět do košíku
        </Link>
        <Link href="/store/checkout" className="btn btn-primary">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">replay</span>
          Zkusit znovu
        </Link>
      </div>

      <Link href="/store/catalog" className="text-sm text-on-surface-variant hover:text-primary transition-colors">
        Nebo pokračovat v nákupu
      </Link>
    </main>
  );
}