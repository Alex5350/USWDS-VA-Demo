import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { ReportsView } from "@/components/reports/ReportsView";

export const metadata: Metadata = {
  title: "Reports"
};

export default function ReportsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Power BI-ready reporting"
        title="Reports"
        description="SQL-backed reporting views, CSV export actions, trend summaries, and a placeholder for future Power BI embedding."
      />
      <ReportsView />
    </div>
  );
}
