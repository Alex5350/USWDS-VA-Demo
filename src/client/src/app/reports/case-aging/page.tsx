import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ReportWorkbenchView } from "@/components/reports/ReportWorkbenchView";

export const metadata: Metadata = {
  title: "Case Aging Report"
};

export default function CaseAgingReportPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Workload aging"
        title="Case Aging Report"
        description="Filter workflow aging by case status, date range, provider, provider type, and state or territory."
      />
      <Suspense fallback={<p className="status-text">Loading report filters.</p>}>
        <ReportWorkbenchView kind="case-aging" />
      </Suspense>
    </div>
  );
}
