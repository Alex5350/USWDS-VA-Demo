import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ReportWorkbenchView } from "@/components/reports/ReportWorkbenchView";

export const metadata: Metadata = {
  title: "Reports"
};

export default function ReportsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="SQL-backed reporting"
        title="Reporting Command Center"
        description="Filtered SQL-backed reporting with executive metrics, provider concentration, questioned cost trends, case aging, and CSV/PDF export actions."
      />
      <Suspense fallback={<p className="status-text">Loading report filters.</p>}>
        <ReportWorkbenchView kind="command-center" />
      </Suspense>
    </div>
  );
}
