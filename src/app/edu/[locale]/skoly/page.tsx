// /edu/skoly: "VeVit Edu pro školy". Nahoře okno „Máš kód školy?“ (žák zadá kód školy, jméno,
// příjmení a kmenovou třídu a vstoupí do portálu /edu/school), pod ním nabídka pro školy
// s formulářem zájmu. Kdo už ve škole je, dostane tlačítko „Vstoupit do třídy“.
import { connection } from "next/server";
import type { Metadata } from "next";
import { readEduLocale } from "@/lib/edu/locale";
import type { LocaleParams } from "@/lib/edu/locale";
import { schoolHome } from "@/lib/edu/school/school";
import { getSchoolViewer, inSchool } from "@/lib/edu/school/viewer";
import { EduRoot } from "@/components/edu/edu-root";
import { EduSkolyPage } from "@/components/edu/pages/skoly-page";
import { JoinSchool } from "@/components/edu/pages/join-school";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "VeVit Edu pro školy" };
}

export default async function EduSkolyPageRoute({ params }: LocaleParams) {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(params), getSchoolViewer()]);
  const back = encodeURIComponent(`/${locale}/edu/skoly#skola`);
  const schoolName = inSchool(viewer)
    ? viewer.student?.schoolName ?? viewer.teacherOf[0]?.name ?? viewer.adminOf[0]?.name ?? "VeVit"
    : null;
  const join = (
    <JoinSchool
      loggedIn={viewer.userId !== null}
      csrfToken={viewer.csrfToken}
      schoolName={schoolName}
      loginHref={`/${locale}/account/login?return_to=${back}`}
      registerHref={`/${locale}/account/register`}
      portalHref={schoolHome(locale)}
    />
  );
  return (
    <EduRoot locale={locale}>
      <EduSkolyPage locale={locale} join={join} />
    </EduRoot>
  );
}
