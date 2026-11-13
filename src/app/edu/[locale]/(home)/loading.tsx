import { SkeletonRegion } from "@/components/ui/skeleton";
import { EduHomeSkeleton, EduPageSkeleton } from "@/components/edu/skeletons";

export default function EduLoading() {
  return (
    <EduPageSkeleton>
      <SkeletonRegion><EduHomeSkeleton /></SkeletonRegion>
    </EduPageSkeleton>
  );
}
