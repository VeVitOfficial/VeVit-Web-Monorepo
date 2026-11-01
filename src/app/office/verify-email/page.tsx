import type { Metadata } from "next";
import { VerifyEmailPage } from "@/components/office/office-pages";

import "../../../../public/assets/fonts/vevit-fonts.css";
import "@/styles/account.css";

export const metadata: Metadata = { title: "Ověření e-mailu", robots: { index: false, follow: false } };

export default function Page() {
  return <VerifyEmailPage />;
}
