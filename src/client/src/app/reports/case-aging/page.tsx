import type { Metadata } from "next";

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
      <ReportWorkbenchView kind="case-aging" />
    </div>
  );
}
