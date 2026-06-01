import type { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Executive Dashboard"
};

export default function DashboardPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Executive summary"
        title="Executive Dashboard"
        description="Key synthetic metrics for claim risk, questioned cost estimates, provider patterns, and open case workload."
      />
      <DashboardView />
    </div>
  );
}
