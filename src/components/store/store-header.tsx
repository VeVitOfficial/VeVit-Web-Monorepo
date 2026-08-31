import Image from "next/image";
import Link from "next/link";

export function StoreHeader() {
  return (
    <header className="store-header">
      <Link className="store-brand" href="/store">
        <Image src="/store/images/logo_notext.webp" width={42} height={42} alt="" priority />
        <span>VeVit <b>Store</b></span>
      </Link>
      <nav aria-label="Obchod">
        <Link href="/store/catalog">Katalog</Link>
        <Link href="/store/catalog?deals=1">Akce</Link>
        <Link href="/store/cart">Košík</Link>
        <Link href="/store/orders">Objednávky</Link>
        <Link href="/store/favorites">Oblíbené</Link>
        <Link href="/account">Účet</Link>
      </nav>
    </header>
  );
}
