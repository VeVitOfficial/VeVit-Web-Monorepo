// Skeleton obsahu účtu (shell s navigací zůstává z layoutu). Karty se stejnou obálkou jako sekce účtu.
// Používá se v loading.tsx jednotlivých sekcí; admin ho nemá, protože jeho stránka volá notFound()
// a uvnitř loading boundary by vrátila status 200 místo 404.
import { Skeleton, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";

function CardSkeleton({ lines }: { lines: number }) {
  return (
    <div className="card">
      <div className="card-heading">
        <Skeleton width="2.25rem" height="2.25rem" radius="0.6rem" />
        <div style={{ flex: 1 }}><Skeleton width="40%" height="1.1rem" /><Skeleton width="65%" height="0.85rem" style={{ marginTop: "6px" }} /></div>
      </div>
      <SkeletonText lines={lines} lastLineWidth="50%" style={{ marginTop: "16px" }} />
    </div>
  );
}

export function AccountDashboardSkeleton() {
  return (
    <SkeletonRegion className="overview-grid">
      <CardSkeleton lines={2} />
      <CardSkeleton lines={3} />
      <CardSkeleton lines={3} />
    </SkeletonRegion>
  );
}
