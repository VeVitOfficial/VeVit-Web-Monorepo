import Link from "next/link";
import { notFound } from "next/navigation";
import { FREE_SHIPPING_THRESHOLD_MINOR, SHIPPING_PRICES_MINOR } from "@/lib/checkout/shipping";

// Prices come from the one shipping module so the information page can never disagree with the checkout.
const czk = (minor: number) => `${(minor / 100).toLocaleString("cs-CZ")}\u00a0Kč`;
const PICKUP_PRICE = czk(SHIPPING_PRICES_MINOR.packeta_pickup);
const ADDRESS_PRICE = czk(SHIPPING_PRICES_MINOR.address);
const FREE_FROM = czk(FREE_SHIPPING_THRESHOLD_MINOR);

type Content = { title: string; lead: string; sections: Array<{ title: string; body: string }> };
const pages: Record<string, Content> = {
  about: {
    title: "O VeVit Store",
    lead: "Moderní e-shop zaměřený na digitální a fyzické produkty s důrazem na bezpečnost, transparentnost a spokojenost zákazníka.",
    sections: [
      { title: "Bezpečnost", body: "Platby kartou zpracovává Stripe. Údaje karty se odesílají přímo do Stripe a VeVit je neukládá." },
      { title: "Transparentnost", body: "Zobrazujeme reálné ceny bez skrytých poplatků a stav objednávky ověřujeme na serveru." },
      { title: "Rychlost a podpora", body: "Digitální produkty jsou dostupné po potvrzení platby. Fyzické zboží odesíláme zpravidla do dvou pracovních dní." }
    ]
  },
  contact: {
    title: "Kontakt",
    lead: "Máte dotaz k objednávce, produktu nebo potřebujete pomoc? Napište nám na info@vevit.cz.",
    sections: [
      { title: "Doba odezvy", body: "Na e-maily odpovídáme obvykle do 24 hodin v pracovní dny." },
      { title: "Objednávky", body: "Po zaplacení obdržíte potvrzení e-mailem. U dotazu vždy uveďte číslo objednávky." },
      { title: "Faktury", body: "Fakturu zasíláme po dokončení objednávky. Potřebujete-li ji znovu nebo s firemními údaji, kontaktujte podporu." }
    ]
  },
  shipping: {
    title: "Doprava a platba",
    lead: "Fyzické produkty doručujeme po České republice a na Slovensko, digitální produkty zpřístupňujeme po potvrzení platby.",
    sections: [
      { title: "Zásilkovna: výdejní místo nebo Z-BOX", body: `Zboží si vyzvednete na výdejním místě nebo v Z-BOXu v ČR a SR, které vyberete na mapě Zásilkovny. Doprava stojí ${PICKUP_PRICE}. Na vyzvednutí vás upozorní SMS, proto při objednávce uveďte telefon.` },
      { title: "Doručení na adresu", body: `Doručení domů nebo do práce v ČR a SR stojí ${ADDRESS_PRICE}. Dopravce a doba doručení se upřesní v potvrzení objednávky.` },
      { title: "Doprava zdarma", body: `Doprava je zdarma u objednávek od ${FREE_FROM} a pro členy Premium od úrovně Silver, u obou způsobů doručení.` },
      { title: "Digitální produkty", body: "Odkaz ke stažení dostanete po potvrzení platby. Obsahuje-li košík jen digitální produkty, výběr dopravy se přeskočí." },
      { title: "Nákup na firmu", body: "V pokladně zapněte „Nakupuji na firmu“ a zadejte IČO. Název, DIČ a sídlo doplníme z registru ARES, případně je můžete vyplnit ručně. Fakturu pošleme e-mailem po zaplacení." },
      { title: "Platba", body: "Zaplatit můžete platební kartou (Visa, Mastercard, Maestro, American Express), přes Apple Pay, Google Pay nebo PayPal. Platby zpracovává Stripe. Údaje karty se odesílají přímo do Stripe a VeVit je neukládá. Apple Pay a Google Pay se nabízejí jen na zařízeních, která je podporují." }
    ]
  },
  returns: {
    title: "Vrácení a reklamace",
    lead: "U fyzického zboží může spotřebitel odstoupit od smlouvy do 14 dní od doručení. Zákonná práva tím nejsou dotčena.",
    sections: [
      { title: "Fyzické produkty", body: "Zboží vraťte v původním stavu. Peníze vracíme do 14 dnů od obdržení vráceného zboží." },
      { title: "Digitální produkty", body: "Po zahájení stahování nebo zpřístupnění digitálního obsahu může právo na odstoupení zaniknout, pokud s tím zákazník před nákupem souhlasil." },
      { title: "Reklamace", body: "Napište na info@vevit.cz číslo objednávky a popis závady. Reklamaci vyřídíme v zákonné lhůtě." }
    ]
  },
  terms: {
    title: "Obchodní podmínky",
    lead: "Podmínky nákupu v internetovém obchodě VeVit Store. Platné od 1. 1. 2025, verze 1.0.",
    sections: [
      { title: "Objednávka a smlouva", body: "Objednávka je návrhem kupní smlouvy. Smlouva vzniká přijetím objednávky, o kterém je kupující informován potvrzovacím e-mailem." },
      { title: "Ceny a platba", body: "Ceny jsou uvedeny v Kč včetně DPH. Platba probíhá elektronicky prostřednictvím Stripe." },
      { title: "Dodání", body: "Digitální produkty jsou zpřístupněny po potvrzení platby. Fyzické zboží obvykle odesíláme do dvou pracovních dní." },
      { title: "Odstoupení a reklamace", body: "Spotřebitel může u fyzického zboží odstoupit do 14 dní od převzetí. Na zboží se vztahují zákonná práva z vadného plnění." },
      { title: "Rozhodné právo", body: "Vztahy se řídí právem České republiky. Mimosoudní řešení spotřebitelských sporů zajišťuje Česká obchodní inspekce." }
    ]
  },
  privacy: {
    title: "Ochrana soukromí",
    lead: "Shromažďujeme jen údaje nezbytné pro vyřízení objednávky. Neprodáváme je třetím stranám a platební údaje zpracovává Stripe.",
    sections: [
      { title: "Jaké údaje zpracováváme", body: "Jméno, e-mail, telefon, zvolené výdejní místo nebo doručovací adresa, u nákupu na firmu IČO, DIČ a sídlo, identifikátor objednávky, stav platby a čas udělených souhlasů." },
      { title: "Účel a doba uchování", body: "Údaje používáme k plnění smlouvy a zákonných povinností. Daňové doklady uchováváme po zákonem stanovenou dobu." },
      { title: "Příjemci", body: "Údaje nezbytné pro platbu získává Stripe. Zásilkovna dostane jméno, telefon, e-mail a místo vyzvednutí, aby mohla zásilku doručit a poslat vám SMS. Údaje nepředáváme marketingovým partnerům." },
      { title: "Vaše práva", body: "Máte právo na přístup, opravu, výmaz, omezení zpracování a přenositelnost. Žádost pošlete na info@vevit.cz." },
      { title: "Cookies a localStorage", body: "Košík používá localStorage, rozpracovaná pokladna sessionStorage (do zaplacení objednávky, bez údajů karty). Mapa Zásilkovny si ukládá poslední zvolené výdejní místo. Analytické měření se řídí nastavením souhlasu a konfigurací Vercelu." }
    ]
  }
};

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const content = pages[(await params).page];
  return content ? { title: content.title, description: content.lead } : {};
}

export default async function InformationPage({ params }: { params: Promise<{ page: string }> }) {
  const content = pages[(await params).page];
  if (!content) notFound();
  return <main className="store-main store-info"><p className="store-eyebrow">VeVit Store</p><h1>{content.title}</h1><p className="store-info-lead">{content.lead}</p>{content.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}<div className="store-actions"><Link className="store-button primary" href="/store/catalog">Přejít do katalogu</Link>{content === pages.contact ? <a className="store-button" href="mailto:info@vevit.cz">info@vevit.cz</a> : null}</div></main>;
}
