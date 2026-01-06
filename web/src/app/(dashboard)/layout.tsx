'use client';

import { AppLayout } from "@/components/navigation";
import { ErrorBoundary, PageErrorFallback } from "@/components/error";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <PageErrorFallback
          title="Something went wrong"
          message="An error occurred in the dashboard."
          error={error}
          onRetry={reset}
          onGoBack={() => router.back()}
        />
      )}
    >
      <AppLayout>{children}</AppLayout>
    </ErrorBoundary>
  );
}
