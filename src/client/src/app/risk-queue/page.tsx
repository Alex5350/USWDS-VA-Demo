import type { Metadata } from "next";
import { Suspense } from "react";

import { RiskQueuePageActions } from "@/components/dashboard/RiskQueuePageActions";
import { RiskQueueView } from "@/components/dashboard/RiskQueueView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Risk Queue"
};

export default function RiskQueuePage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Analyst triage"
        title="Risk Queue"
        description="Accessible filterable queue of synthetic Community Care claims prioritized by deterministic risk indicators."
      >
        <RiskQueuePageActions />
      </PageHeader>
      <Suspense fallback={<p className="status-text">Loading risk queue filters.</p>}>
        <RiskQueueView />
      </Suspense>
    </div>
  );
}
