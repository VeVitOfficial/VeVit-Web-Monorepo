// Skeleton je aspoň na výšku viewportu, aby patička layoutu po doběhnutí obsahu neposkočila (CLS).
// Skeletony VeVit Services (loading.tsx). Renderují se uvnitř layoutu (.svc-container), třídy ze services.css.
import { Skeleton, SkeletonGrid, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

export function ServicesHomeSkeleton() {
  return (
    <SkeletonRegion style={{ minHeight: "100vh" }}>
      <section className="svc-hero2">
        <div className="svc-hero2__text" style={{ display: "grid", justifyItems: "center", gap: "6px" }}>
          <Skeleton width="10rem" height="0.85rem" />
          <Skeleton width="min(34rem, 95%)" height="clamp(60px, 9vw, 96px)" />
          <Skeleton width="min(26rem, 80%)" height="1rem" />
        </div>
        <div className="svc-herosearch" style={{ marginTop: 28 }}>
          <Skeleton height="3rem" radius="12px" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} width="6.5rem" height="2.1rem" radius="999px" />)}
        </div>
      </section>
      <SkeletonGrid count={2} minWidth="22rem" card={{ lines: 3 }} className="mt-8" />
    </SkeletonRegion>
  );
}

export function ServicesListSkeleton() {
  return (
    <SkeletonRegion style={{ minHeight: "100vh" }}>
      <div className="svc-searchrow">
        <Skeleton height="3.4rem" radius="14px" />
      </div>
      <div className="svc-results">
        <div style={{ display: "grid", gap: "12px" }}>
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height="2.25rem" />)}
        </div>
        <div className="svc-results__main">
          <div className="svc-results__head">
            <div><Skeleton width="14rem" height="1.6rem" /><Skeleton width="8rem" height="0.9rem" style={{ marginTop: "6px" }} /></div>
            <Skeleton width="10rem" height="2.25rem" />
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height="10.5rem" radius="12px" />)}
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function ServicesDetailSkeleton() {
  return (
    <SkeletonRegion style={{ minHeight: "100vh" }}>
      <Skeleton width="12rem" height="0.9rem" />
      <div className="svc-two">
        <div style={{ display: "grid", gap: "16px" }}>
          <Skeleton height="13rem" radius="12px" />
          <SkeletonText lines={4} lastLineWidth="45%" />
        </div>
        <div style={{ display: "grid", gap: "16px" }}>
          <Skeleton height="11rem" radius="12px" />
          <Skeleton height="9rem" radius="12px" />
        </div>
      </div>
    </SkeletonRegion>
  );
}
