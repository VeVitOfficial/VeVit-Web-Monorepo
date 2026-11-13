// Skeleton těla nástroje (obsah .tool-tool): dropzóna + tlačítko. Používá ho next/dynamic
// v registru nástrojů jako `loading` (při klientské navigaci, než dorazí chunk nástroje)
// a loading.tsx stránky nástroje.
import { Skeleton } from "@/components/ui/skeleton";

export function ToolBodySkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton height="14rem" radius="0.75rem" />
      <Skeleton width="10rem" height="2.75rem" radius="0.5rem" style={{ marginTop: "1rem" }} />
    </div>
  );
}
