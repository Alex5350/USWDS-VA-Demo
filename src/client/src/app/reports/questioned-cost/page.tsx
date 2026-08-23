import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ReportWorkbenchView } from "@/components/reports/ReportWorkbenchView";

export const metadata: Metadata = {
  title: "Questioned Cost Report"
};

export default function QuestionedCostReportPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Financial trend analysis"
        title="Questioned Cost Report"
        description="Filter estimated questioned cost trend data by date, provider, status, state, and provider type."
      />
      <Suspense fallback={<p className="status-text">Loading report filters.</p>}>
        <ReportWorkbenchView kind="questioned-cost" />
      </Suspense>
    </div>
  );
}
