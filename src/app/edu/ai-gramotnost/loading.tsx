// Skeleton sekce AI gramotnost: stejná obálka jako AifbFrame (.aigram.aifb > main.aifb-main).
import { Skeleton, SkeletonGrid, SkeletonRegion, SkeletonText } from "@/components/ui/skeleton";
import { EduPageSkeleton } from "@/components/edu/skeletons";

export default function AiGramLoading() {
  return (
    <EduPageSkeleton>
      <div className="aigram aifb aifb--clean">
        <SkeletonRegion className="aigram-main aifb-main">
          <Skeleton width="12rem" height="0.9rem" />
          <Skeleton width="min(32rem, 90%)" height="2.6rem" style={{ marginTop: "1rem" }} />
          <SkeletonText lines={2} lastLineWidth="55%" style={{ marginTop: "1rem", maxWidth: "40rem" }} />
          <SkeletonGrid count={6} minWidth="16rem" card={{ lines: 2 }} className="mt-8" />
        </SkeletonRegion>
      </div>
    </EduPageSkeleton>
  );
}
