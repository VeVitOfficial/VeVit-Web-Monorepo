import type { Metadata } from "next";
import { connection } from "next/server";
import { getProvider, listCategories, viewer } from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { ProviderForm } from "@/components/services/actions";

export const metadata: Metadata = { title: "Profil poskytovatele – VeVit Services" };

export default async function ProviderProfileEditPage() {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const session = await viewer();
  if (!session) {
    return (
      <div className="svc-empty">
        <p>Profil poskytovatele si založíte po přihlášení.</p>
        <p style={{ marginTop: 12 }}>
          <a className="svc-btn svc-btn--primary" href={`/${locale}/account/login?return_to=${encodeURIComponent(`${base}/profil`)}`}>Přihlásit se</a>
        </p>
      </div>
    );
  }
  const [categories, provider] = await Promise.all([listCategories(), getProvider(session.user.id)]);
  return (
    <div style={{ maxWidth: 720 }}>
      <p className="svc-eyebrow">Profil poskytovatele</p>
      <h1 className="svc-h1">{provider ? "Upravit profil" : "Začněte nabízet služby"}</h1>
      <p className="svc-lead" style={{ marginBottom: 24 }}>
        Profil uvidí zadavatelé u vašich nabídek. {provider ? <a href={`${base}/poskytovatel/${session.user.id}`}>Zobrazit veřejný profil</a> : null}
      </p>
      <ProviderForm categories={categories} initial={provider} base={base} />
    </div>
  );
}
