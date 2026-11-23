// Skeleton stránky nástroje: stejná obálka (hlavička, drobečky, hlavička nástroje, tool-shell, trust),
// aby po načtení nic neposkočilo. Styly musí přijít i sem, protože stránka je importuje sama.
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import "@/styles/tools.css";
import "../../../../../public/assets/shared/app-switcher.css";

export default function ToolLoading() {
  return (
    <SkeletonRegion>
      <header className="site-header glass">
        <div className="container bar">
          <Skeleton width="9rem" height="2rem" />
          <Skeleton width="6rem" height="2.25rem" />
        </div>
      </header>
      <main className="main tool-page">
        <nav className="breadcrumb"><Skeleton width="16rem" height="0.875rem" /></nav>
        <div className="tool-header">
          <Skeleton width="2.5rem" height="2.5rem" radius="0.5rem" />
          <Skeleton width="min(22rem, 60vw)" height="2.25rem" />
          <Skeleton width="5rem" height="1.5rem" />
        </div>
        <SkeletonText lines={2} lastLineWidth="45%" className="tool-desc" style={{ maxWidth: "36rem" }} />
        <div className="tool-shell glass">
          <Skeleton height="14rem" radius="0.75rem" />
          <Skeleton width="10rem" height="2.75rem" radius="0.5rem" style={{ marginTop: "1rem" }} />
        </div>
        <div className="tool-trust"><SkeletonText lines={2} lastLineWidth="70%" /></div>
      </main>
    </SkeletonRegion>
  );
}
