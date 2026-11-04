import type { Metadata } from "next";
import { LegalPage } from "@/components/office/office-pages";

import "../../../../public/assets/fonts/vevit-fonts.css";
import "@/styles/account.css";

export const metadata: Metadata = { title: "Právní informace · VeVit Office", robots: { index: false, follow: false } };

export default function Page() {
  return <LegalPage />;
}
