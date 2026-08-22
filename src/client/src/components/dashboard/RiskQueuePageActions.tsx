"use client";

import { UsaButton } from "@/components/uswds/UsaButton";
import { useDemoUser } from "@/lib/demo-auth";

export function RiskQueuePageActions() {
  const { hasPermission } = useDemoUser();

  if (!hasPermission("CanCreateCaseRecord")) {
    return null;
  }

  return (
    <div className="page-header-actions">
      <UsaButton href="/cases/new">Create case record</UsaButton>
    </div>
  );
}
