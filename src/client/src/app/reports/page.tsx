import type { Metadata } from "next";

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
      <ReportWorkbenchView kind="command-center" />
    </div>
  );
}
