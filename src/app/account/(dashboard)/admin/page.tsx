import { notFound } from "next/navigation";
import { AdminConsole } from "@/components/account/sections/admin-console";
import { loadSessionFromCookies } from "@/lib/account-session";
import { getUserAccess, hasPermission } from "@/lib/permissions";

// Owner / staff console. Non-staff get a 404, the same as a missing page.
export default async function Page() {
  const session = await loadSessionFromCookies();
  if (!session || !hasPermission(await getUserAccess(session.user.id), "admin.console")) notFound();
  return <AdminConsole />;
}
