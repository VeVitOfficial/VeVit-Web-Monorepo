// Skeleton rozcestníku nástrojů (hero se statistikami, vyhledávání, mřížka karet).
import { Skeleton, SkeletonGrid, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import "@/styles/tools.css";
import "../../../../public/assets/shared/app-switcher.css";

export default function ToolsHubLoading() {
  return (
    <SkeletonRegion className="tools-hub">
      <header className="site-header glass">
        <div className="container bar">
          <Skeleton width="9rem" height="2rem" />
          <Skeleton width="6rem" height="2.25rem" />
        </div>
      </header>
      <section className="hero">
        <div className="hero-inner hub-hero-inner">
          <div className="hub-hero-top">
            <div className="hub-hero-copy">
              <Skeleton width="10rem" height="0.75rem" />
              <Skeleton width="min(30rem, 90%)" height="3rem" style={{ margin: "0.75rem 0" }} />
              <SkeletonText lines={2} lastLineWidth="55%" style={{ maxWidth: "40rem" }} />
            </div>
            <div className="hub-hero-stats">
              {[0, 1, 2].map((i) => (
                <div className="hub-stat" key={i}><Skeleton width="3rem" height="1.9rem" /><Skeleton width="5rem" height="0.75rem" style={{ marginTop: "0.35rem" }} /></div>
              ))}
            </div>
          </div>
          <Skeleton height="3.5rem" radius="0" />
        </div>
      </section>
      <main className="main container" style={{ paddingTop: "2.5rem", paddingBottom: "3rem" }}>
        <SkeletonGrid count={9} minWidth="17rem" card={{ lines: 2 }} />
      </main>
    </SkeletonRegion>
  );
}
