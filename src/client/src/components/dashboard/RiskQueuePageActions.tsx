"use client";

import { UsaButton } from "@/components/uswds/UsaButton";
import { useDemoUser } from "@/lib/demo-auth";

export function RiskQueuePageActions() {
  const { hasPermission } = useDemoUser();
  const canCreateCaseRecord = hasPermission("CanCreateCaseRecord");
  const canRestoreDeletedCases = hasPermission("CanDeleteCase");

  if (!canCreateCaseRecord && !canRestoreDeletedCases) {
    return null;
  }

  return (
    <div className="page-header-actions">
      {canCreateCaseRecord ? <UsaButton href="/cases/new">Create case record</UsaButton> : null}
      {canRestoreDeletedCases ? (
        <UsaButton href="/cases/recycle-bin" variant="outline">
          Recycle bin
        </UsaButton>
      ) : null}
    </div>
  );
}
