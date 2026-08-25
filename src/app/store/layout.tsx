import { StoreHeader } from "@/components/store/store-header";

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="store-shell"><StoreHeader />{children}</div>;
}
