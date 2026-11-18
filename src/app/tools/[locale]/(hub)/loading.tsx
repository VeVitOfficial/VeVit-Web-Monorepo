// Skeleton hubu EveryTool.cz (hero s vyhledáváním + mřížka karet).
import { Skeleton, SkeletonGrid, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import "@/styles/tools.css";
import "../../../../../public/assets/shared/app-switcher.css";

export default function ToolsHubLoading() {
  return (
    <SkeletonRegion className="et-main">
      <header className="site-header et-hdr">
        <div className="et-wrap et-hdr-in">
          <Skeleton width="11rem" height="2.6rem" />
          <Skeleton width="6rem" height="2.75rem" />
        </div>
      </header>
      <section className="et-hero">
        <div className="et-hero-in">
          <Skeleton width="22rem" height="2rem" style={{ maxWidth: "90%" }} />
          <Skeleton width="min(34rem, 92%)" height="4rem" style={{ margin: "1.25rem 0 0.5rem" }} />
          <Skeleton width="9rem" height="0.75rem" style={{ margin: "0 auto 1rem" }} />
          <SkeletonText lines={2} lastLineWidth="55%" style={{ maxWidth: "40rem", margin: "0 auto" }} />
          <Skeleton height="4.25rem" radius="999px" style={{ margin: "1.5rem auto 0", maxWidth: "42.5rem" }} />
        </div>
      </section>
      <div className="et-wrap" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <SkeletonGrid count={8} minWidth="16rem" card={{ lines: 2 }} />
      </div>
    </SkeletonRegion>
  );
}
