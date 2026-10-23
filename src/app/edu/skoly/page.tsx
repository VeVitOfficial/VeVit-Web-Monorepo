// /edu/skoly: "VeVit Edu pro školy". Nahoře okno „Máš kód třídy?“ (žák se připojí ke třídě
// a dostane rank student), pod ním coming-soon nabídka pro školy s formulářem zájmu.
// Na stránku vede tlačítko „VeVit Edu pro školy“ na hlavním webu. Server zjistí přihlášení
// a třídy žáka, klientské komponenty vykreslí stránku.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import { isStaff } from "@/lib/edu/aifb/access";
import { getCatalog } from "@/lib/edu/aifb/content";
import { hubPath, schoolsPath, teacherPath } from "@/lib/edu/aifb/routes";
import { getViewer } from "@/lib/edu/aifb/viewer";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSkolyPage } from "@/components/edu/pages/skoly-page";
import { JoinClass } from "@/components/edu/pages/join-class";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "VeVit Edu pro školy" };
}

export default async function EduSkolyPageRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), getViewer()]);
  const categories = getCatalog().categories;
  const back = encodeURIComponent(`${schoolsPath(locale)}#trida`);
  const join = (
    <JoinClass
      loggedIn={viewer.userId !== null}
      csrfToken={viewer.csrfToken}
      classes={viewer.classes.map((item) => ({
        id: item.id,
        name: item.name,
        categoryTitle: categories.find((category) => category.id === item.category)?.title ?? item.category,
      }))}
      isStaff={isStaff(viewer)}
      loginHref={`/${locale}/account/login?return_to=${back}`}
      registerHref={`/${locale}/account/register`}
      aifbHref={hubPath(locale)}
      teacherHref={teacherPath(locale)}
    />
  );
  return (
    <EduRoot locale={locale}>
      <EduSkolyPage locale={locale} join={join} />
    </EduRoot>
  );
}
