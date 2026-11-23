// Skeletony VeVit Store (loading.tsx). Obálky a mřížky používají třídy storefront.css,
// aby rozměry seděly s reálnou stránkou.
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

export function StoreCardSkeleton() {
  return (
    <div className="sf-card" aria-hidden="true">
      <Skeleton height="0" style={{ paddingBottom: "100%" }} radius="0" />
      <div style={{ padding: "12px", display: "grid", gap: "8px" }}>
        <SkeletonText lines={2} lastLineWidth="70%" />
        <Skeleton width="45%" height="1.2rem" />
      </div>
    </div>
  );
}

export function StoreGridSkeleton({ count = 10, catalog = false }: { count?: number; catalog?: boolean }) {
  return (
    <div className={catalog ? "sf-grid sf-grid--catalog" : "sf-grid"}>
      {Array.from({ length: count }, (_, i) => <StoreCardSkeleton key={i} />)}
    </div>
  );
}

export function StoreHomeSkeleton() {
  return (
    <SkeletonRegion className="sf-main" style={{ minHeight: "100vh" }}>
      <div className="sf-home-top">
        <div className="sf-catmenu" style={{ gap: "10px" }}>
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} height="1.6rem" />)}
        </div>
        <div className="sf-hero">
          <div>
            <Skeleton width="12rem" height="0.8rem" />
            <Skeleton width="min(26rem, 90%)" height="2.4rem" style={{ margin: "12px 0" }} />
            <SkeletonText lines={2} lastLineWidth="60%" style={{ maxWidth: "36rem" }} />
            <Skeleton height="3rem" radius="0.6rem" style={{ marginTop: "20px", maxWidth: "36rem" }} />
          </div>
        </div>
        <Skeleton height="4rem" />
      </div>
      <section className="sf-section">
        <Skeleton width="12rem" height="1.5rem" style={{ marginBottom: "16px" }} />
        <StoreGridSkeleton count={5} />
      </section>
    </SkeletonRegion>
  );
}

export function StoreCatalogSkeleton() {
  return (
    <SkeletonRegion className="sf-main" style={{ minHeight: "100vh" }}>
      <Skeleton width="16rem" height="0.9rem" />
      <Skeleton width="min(20rem, 70%)" height="2rem" style={{ margin: "14px 0 20px" }} />
      <StoreGridSkeleton count={12} catalog />
    </SkeletonRegion>
  );
}

export function StoreProductSkeleton() {
  return (
    <SkeletonRegion className="sf-main" style={{ minHeight: "100vh" }}>
      <Skeleton width="18rem" height="0.9rem" style={{ marginBottom: "20px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "32px" }}>
        <Skeleton height="0" style={{ paddingBottom: "100%" }} radius="16px" />
        <div style={{ display: "grid", gap: "14px", alignContent: "start" }}>
          <Skeleton width="8rem" height="0.8rem" />
          <Skeleton width="90%" height="2.2rem" />
          <Skeleton width="10rem" height="2rem" />
          <SkeletonText lines={4} lastLineWidth="50%" />
          <Skeleton width="14rem" height="3rem" radius="10px" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
