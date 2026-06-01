"use client";

import { UsaButton } from "@/components/uswds/UsaButton";
import { useDemoUser } from "@/lib/demo-auth";

export function RiskQueuePageActions() {
  const { hasPermission } = useDemoUser();

  if (!hasPermission("CanCreateRiskRecord")) {
    return null;
  }

  return (
    <div className="page-header-actions">
      <UsaButton href="/risk-queue/new">Add review candidate</UsaButton>
    </div>
  );
}
