import type { Metadata } from "next";
import { LinkPage } from "@/components/office/office-pages";

import "../../../../public/assets/fonts/vevit-fonts.css";
import "../../../../account/assets/styles.css";

export const metadata: Metadata = { title: "Propojit server VeVit Office", robots: { index: false, follow: false } };

export default function Page() {
  return <LinkPage />;
}
