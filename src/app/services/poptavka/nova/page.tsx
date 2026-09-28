import type { Metadata } from "next";
import { connection } from "next/server";
import { listCategories, viewer } from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { RequestForm } from "@/components/services/actions";

export const metadata: Metadata = { title: "Zadat poptávku – VeVit Services" };

export default async function NewRequestPage() {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const session = await viewer();
  if (!session) {
    return (
      <div className="svc-empty">
        <p>Poptávku může zadat jen přihlášený uživatel VeVit.</p>
        <p style={{ marginTop: 12 }}>
          <a className="svc-btn svc-btn--primary" href={`/${locale}/account/login?return_to=${encodeURIComponent(`${base}/poptavka/nova`)}`}>Přihlásit se</a>
        </p>
      </div>
    );
  }
  const categories = await listCategories();
  return (
    <div style={{ maxWidth: 720 }}>
      <p className="svc-eyebrow">Nová poptávka</p>
      <h1 className="svc-h1">Co potřebujete udělat?</h1>
      <p className="svc-lead" style={{ marginBottom: 24 }}>Čím přesnější popis, tím lepší nabídky dostanete.</p>
      <RequestForm categories={categories} base={base} />
    </div>
  );
}
