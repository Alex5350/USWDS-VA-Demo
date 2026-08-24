import type { Metadata } from "next";

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
      <ReportWorkbenchView kind="questioned-cost" />
    </div>
  );
}
