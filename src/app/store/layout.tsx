import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";

// Original store design system: legacy fonts (incl. Material Symbols),
// compiled Tailwind build and the storefront design tokens —
// see store/lib/tw_config.php for the PHP load order.
import "../../../public/assets/fonts/vevit-fonts.css";
import "../../../public/assets/css/vevit-tailwind.css";
import "../../../store/assets/css/style.css";
import "./store-design.css";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-body-md text-body-md antialiased pb-16 md:pb-0">
      <StoreHeader />
      {children}
      <StoreFooter />
    </div>
  );
}