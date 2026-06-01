import type { Metadata } from "next";

import { RulesView } from "@/components/dashboard/RulesView";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Risk Rules"
};

export default function RulesPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Explainable scoring"
        title="Risk Rules"
        description="Deterministic business rules used to calculate potential risk scores for synthetic claims."
      />
      <RulesView />
    </div>
  );
}
