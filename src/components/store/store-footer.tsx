import Image from "next/image";
import Link from "next/link";

const SHOP_LINKS = [
  { href: "/store/catalog", label: "Všechny produkty" },
  { href: "/store/catalog?sort=newest", label: "Novinky" },
  { href: "/store/catalog?deals=1", label: "Slevy & akce" },
  { href: "/store/catalog?type=digital", label: "Digitální produkty" },
  { href: "/store/catalog?type=physical", label: "Fyzické produkty" },
];

const CUSTOMER_LINKS = [
  { href: "/cs/store/shipping.php", label: "Doprava a platba" },
  { href: "/cs/store/returns.php", label: "Vrácení a reklamace" },
  { href: "/cs/store/contact.php", label: "Kontakt a podpora" },
  { href: "/cs/store/about.php", label: "O nás" },
];

const LEGAL_LINKS = [
  { href: "/cs/store/terms.php", label: "Obchodní podmínky" },
  { href: "/cs/store/privacy.php", label: "Ochrana soukromí" },
  { href: "/cs/store/returns.php", label: "Právo na odstoupení" },
];

function FooterColumn({ heading, links }: { heading: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="font-mono-label text-mono-label text-on-surface uppercase tracking-widest mb-4">{heading}</h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="font-body-md text-sm text-on-surface-variant hover:text-primary transition-colors duration-150">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Port of store/lib/footer.php — footer + legal links. */
export function StoreFooter() {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant mt-auto" role="contentinfo">
      <div className="max-w-store mx-auto px-margin py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link href="/store" className="flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity">
              <Image src="/store/images/logo_notext.webp" alt="VeVit" width={36} height={36} className="w-9 h-9 rounded-lg object-contain" />
              <span className="font-display text-lg font-extrabold text-on-surface tracking-tight">VeVit<span className="text-primary">.</span></span>
            </Link>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mb-4">
              Moderní e-shop s ověřeným sortimentem. Digitální produkty ihned po platbě, fyzické zboží s doručením do 2 dnů.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-caption text-caption text-on-surface-variant uppercase tracking-wide">Platba:</span>
              <span className="badge badge-neutral">Karta</span>
              <span className="badge badge-neutral">Stripe</span>
            </div>
          </div>

          <FooterColumn heading="Obchod" links={SHOP_LINKS} />
          <FooterColumn heading="Zákazníci" links={CUSTOMER_LINKS} />

          <div>
            <FooterColumn heading="Právní" links={LEGAL_LINKS} />
            <div className="mt-6 flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary icon-filled" aria-hidden="true">lock</span>
              <span className="font-caption text-caption">Zabezpečeno přes Stripe</span>
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-caption text-caption text-on-surface-variant">© {new Date().getFullYear()} VeVit Store. Všechna práva vyhrazena.</p>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px] text-primary icon-filled" aria-hidden="true">favorite</span>
            <span className="font-caption text-caption">Vyrobeno s péčí</span>
          </div>
        </div>
      </div>
    </footer>
  );
}