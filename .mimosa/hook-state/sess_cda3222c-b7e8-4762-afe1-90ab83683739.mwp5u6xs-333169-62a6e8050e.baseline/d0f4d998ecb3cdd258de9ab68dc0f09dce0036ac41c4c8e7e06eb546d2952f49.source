import type { Metadata } from "next";
import { connection } from "next/server";
import { listCategories, renderTime, viewer } from "@/lib/services";
import { servicesLocale } from "@/lib/services-locale";
import { categoryTree } from "@/components/services/categories";
import { RequestForm } from "@/components/services/request-form";

export const metadata: Metadata = { title: "Zadat poptávku zdarma – VeVit Services" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewRequestPage({ searchParams }: Props) {
  await connection();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const session = await viewer();
  if (!session) {
    return (
      <div className="svc-empty svc-empty--big">
        <h1 className="svc-h2" style={{ marginTop: 0 }}>Poptávku může zadat jen přihlášený uživatel VeVit</h1>
        <p>Účet je zdarma. Kontakt na vás uvidí jen poskytovatel, kterého sami vyberete.</p>
        <p style={{ marginTop: 12 }}>
          <a className="svc-btn svc-btn--primary" href={`/${locale}/account/login?return_to=${encodeURIComponent(`${base}/poptavka/nova`)}`}>Přihlásit se</a>
          {" "}
          <a className="svc-btn" href={`/${locale}/account/register`}>Založit účet</a>
        </p>
      </div>
    );
  }
  const categories = await listCategories();
  const params = await searchParams;
  const preset = typeof params.kat === "string" && categories.some((category) => category.slug === params.kat) ? params.kat : "";
  const today = new Date(renderTime()).toISOString().slice(0, 10);
  return (
    <>
      <nav className="svc-crumbs" aria-label="Drobečková navigace">
        <a href={base}>Services</a><span aria-hidden="true">/</span><span>Nová poptávka</span>
      </nav>
      <p className="svc-eyebrow">Nová poptávka</p>
      <h1 className="svc-h1">Co potřebujete udělat?</h1>
      <p className="svc-lead" style={{ marginBottom: 24 }}>Čtyři krátké kroky. Čím přesnější zadání, tím lepší nabídky dostanete.</p>
      <RequestForm
        tree={categoryTree(categories)}
        categories={categories}
        base={base}
        today={today}
        initial={preset ? {
          category: preset, title: "", description: "", job_type: "one_time", budget_type: "fixed",
          budget_min: null, budget_max: null, deadline: null, urgent: false, remote: false, city: null,
        } : undefined}
      />
    </>
  );
}
