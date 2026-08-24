import type { Metadata } from "next";

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
      <ReportWorkbenchView kind="provider-risk" />
    </div>
  );
}
