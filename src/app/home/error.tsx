"use client";

import { ErrorView } from "@/components/ui/error-view";

export default function SectionError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView {...props} homeHref="/home" />;
}
