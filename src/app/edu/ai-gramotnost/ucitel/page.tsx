// /edu/ai-gramotnost/ucitel → třídy učitele se přestěhovaly do portálu VeVit Edu pro školy
// (/edu/school/tridy). Veřejnost a žák dál dostanou stejné přesměrování jako dřív (gateStaff).
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { readEduLocale } from "@/lib/edu/locale";
import { gateStaff } from "@/lib/edu/aifb/gate";
import { getViewer } from "@/lib/edu/aifb/viewer";
import { schoolGroupsPath } from "@/lib/edu/school/school";

export default async function TeacherRoute() {
  await connection();
  const [locale, viewer] = await Promise.all([readEduLocale(), getViewer()]);
  gateStaff(viewer, locale);
  redirect(schoolGroupsPath(locale));
}
