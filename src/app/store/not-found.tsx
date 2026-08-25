import Link from "next/link";

export default function NotFound() {
  return <main className="store-main"><div className="store-empty"><h1>Produkt nebyl nalezen</h1><p>Možná už není v nabídce nebo se změnila jeho adresa.</p><Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link></div></main>;
}
