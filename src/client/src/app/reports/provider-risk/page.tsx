import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ReportWorkbenchView } from "@/components/reports/ReportWorkbenchView";

export const metadata: Metadata = {
  title: "Provider Risk Report"
};

export default function ProviderRiskReportPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Provider intelligence"
        title="Provider Risk Report"
        description="Filter provider-level risk indicators, estimated questioned cost, claim volume, and critical case concentration."
      />
      <Suspense fallback={<p className="status-text">Loading report filters.</p>}>
        <ReportWorkbenchView kind="provider-risk" />
      </Suspense>
    </div>
  );
}
