// Skeleton je aspoň na výšku viewportu, aby patička layoutu po doběhnutí obsahu neposkočila (CLS).
// Skeletony VeVit Services (loading.tsx). Renderují se uvnitř layoutu (.svc-container), třídy ze services.css.
import { Skeleton, SkeletonGrid, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

export function ServicesHomeSkeleton() {
  return (
    <SkeletonRegion style={{ minHeight: "100vh" }}>
      <section className="svc-hero2">
        <div className="svc-hero2__text">
          <Skeleton width="10rem" height="0.85rem" />
          <Skeleton width="min(36rem, 95%)" height="clamp(68px, 11vw, 118px)" style={{ margin: "14px 0 16px" }} />
          <SkeletonText lines={2} lastLineWidth="60%" style={{ maxWidth: "40rem" }} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" }}>
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} width="6.5rem" height="2rem" radius="999px" />)}
          </div>
        </div>
      </section>
      <SkeletonGrid count={2} minWidth="22rem" card={{ lines: 3 }} className="mt-8" />
    </SkeletonRegion>
  );
}

export function ServicesListSkeleton() {
  return (
    <SkeletonRegion className="svc-results" style={{ minHeight: "100vh" }}>
      <div style={{ display: "grid", gap: "12px" }}>
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height="2.25rem" />)}
      </div>
      <div className="svc-results__main">
        <div className="svc-results__head">
          <div><Skeleton width="14rem" height="1.6rem" /><Skeleton width="8rem" height="0.9rem" style={{ marginTop: "6px" }} /></div>
          <Skeleton width="10rem" height="2.25rem" />
        </div>
        <div style={{ display: "grid", gap: "12px" }}>
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height="7rem" radius="14px" />)}
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function ServicesDetailSkeleton() {
  return (
    <SkeletonRegion style={{ minHeight: "100vh" }}>
      <Skeleton width="12rem" height="0.9rem" />
      <Skeleton width="min(32rem, 90%)" height="2.2rem" style={{ margin: "14px 0 20px" }} />
      <div style={{ display: "grid", gap: "16px" }}>
        <Skeleton height="10rem" radius="14px" />
        <SkeletonText lines={4} lastLineWidth="45%" />
      </div>
    </SkeletonRegion>
  );
}
