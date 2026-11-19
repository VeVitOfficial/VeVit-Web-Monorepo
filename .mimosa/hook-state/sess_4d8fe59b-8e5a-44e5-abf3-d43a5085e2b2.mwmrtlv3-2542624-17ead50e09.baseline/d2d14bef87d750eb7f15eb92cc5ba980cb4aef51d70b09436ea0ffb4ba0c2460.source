import type { Metadata } from "next";
import { connection } from "next/server";
import { getProvider, listCategories, viewer } from "@/lib/services";
import { cityByCode } from "@/lib/services-geo";
import { servicesLocale } from "@/lib/services-locale";
import { categoryTree } from "@/components/services/categories";
import { ProviderForm } from "@/components/services/provider-form";

export const metadata: Metadata = { title: "Profil poskytovatele – VeVit Services" };

export default async function ProviderProfileEditPage() {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const session = await viewer();
  if (!session) {
    return (
      <div className="svc-empty svc-empty--big">
        <h1 className="svc-h2" style={{ marginTop: 0 }}>Profil poskytovatele si založíte po přihlášení</h1>
        <p style={{ marginTop: 12 }}>
          <a className="svc-btn svc-btn--primary" href={`/${locale}/account/login?return_to=${encodeURIComponent(`${base}/profil`)}`}>Přihlásit se</a>
        </p>
      </div>
    );
  }
  const [categories, provider] = await Promise.all([listCategories(), getProvider(session.user.id)]);
  const city = provider?.city_code ? cityByCode(provider.city_code) : null;
  return (
    <div style={{ maxWidth: 820 }}>
      <p className="svc-eyebrow">Profil poskytovatele</p>
      <h1 className="svc-h1">{provider ? "Upravit profil" : "Začněte nabízet služby"}</h1>
      <p className="svc-lead" style={{ marginBottom: 24 }}>
        Profil uvidí zadavatelé u vašich nabídek a v katalogu poskytovatelů. Kontakt se zobrazí až po výběru vaší nabídky.
      </p>
      <ProviderForm
        tree={categoryTree(categories)}
        base={base}
        publicHref={provider ? `${base}/poskytovatel/${session.user.id}` : null}
        initial={provider ? {
          headline: provider.headline,
          bio: provider.bio,
          categories: provider.categories ?? [],
          city: city ? { code: city.code, label: city.label } : null,
          radius_km: provider.radius_km,
          remote: provider.remote,
          active: provider.active,
          hourly_rate: provider.hourly_rate,
          website: provider.website ?? "",
        } : null}
      />
    </div>
  );
}
