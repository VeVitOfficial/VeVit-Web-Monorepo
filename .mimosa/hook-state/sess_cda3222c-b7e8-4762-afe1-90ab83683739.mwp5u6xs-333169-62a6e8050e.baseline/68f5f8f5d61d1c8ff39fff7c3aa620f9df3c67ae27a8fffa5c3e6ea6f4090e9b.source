import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getRequest, listCategories, renderTime, viewer } from "@/lib/services";
import { cityByCode } from "@/lib/services-geo";
import { servicesLocale } from "@/lib/services-locale";
import { categoryTree } from "@/components/services/categories";
import { RequestForm } from "@/components/services/request-form";

export const metadata: Metadata = { title: "Upravit poptávku – VeVit Services" };

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRequestPage({ params }: Props) {
  await connection();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const locale = await servicesLocale();
  const base = `/${locale}/services`;
  const [request, session, categories] = await Promise.all([getRequest(id.toLowerCase()), viewer(), listCategories()]);
  if (!request || !session || request.author_id !== session.user.id) notFound();
  if (request.status !== "open") {
    return (
      <div className="svc-empty">
        <p>Upravit lze jen otevřenou poptávku.</p>
        <p style={{ marginTop: 12 }}><a className="svc-btn" href={`${base}/poptavka/${request.id}`}>Zpět na poptávku</a></p>
      </div>
    );
  }
  const city = request.city_code ? cityByCode(request.city_code) : null;
  const today = new Date(renderTime()).toISOString().slice(0, 10);
  return (
    <>
      <nav className="svc-crumbs" aria-label="Drobečková navigace">
        <a href={base}>Services</a><span aria-hidden="true">/</span>
        <a href={`${base}/poptavka/${request.id}`}>{request.title}</a><span aria-hidden="true">/</span><span>Upravit</span>
      </nav>
      <h1 className="svc-h1">Upravit poptávku</h1>
      <RequestForm
        tree={categoryTree(categories)}
        categories={categories}
        base={base}
        today={today}
        initial={{
          id: request.id,
          category: request.category,
          title: request.title,
          description: request.description,
          job_type: request.job_type,
          budget_type: request.budget_type,
          budget_min: request.budget_min,
          budget_max: request.budget_max,
          deadline: request.deadline,
          urgent: request.urgent,
          remote: request.remote,
          city: city ? { code: city.code, label: city.label } : null,
        }}
      />
    </>
  );
}
