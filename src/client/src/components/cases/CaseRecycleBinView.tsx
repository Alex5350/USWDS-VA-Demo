"use client";

import { useEffect, useState } from "react";
import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaBreadcrumb } from "@/components/uswds/UsaBreadcrumb";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaTable } from "@/components/uswds/UsaTable";
import { type DeletedCaseRecord, getDeletedCaseRecords, restoreCaseRecord } from "@/lib/api-client";
import { useDemoUser } from "@/lib/demo-auth";
import { formatDate, preciseCurrencyFormatter } from "@/lib/formatters";

export function CaseRecycleBinView() {
  const { user, hasPermission } = useDemoUser();
  const [records, setRecords] = useState<DeletedCaseRecord[]>([]);
  const [message, setMessage] = useState("Loading deleted case records.");
  const [restoringCaseId, setRestoringCaseId] = useState<number | null>(null);
  const isPersonalRecycleBin = user.role === "Analyst" || user.role === "Investigator";

  useEffect(() => {
    let isMounted = true;

    async function loadRecords() {
      if (!hasPermission("CanDeleteCase")) {
        setMessage("Current demo role cannot view the case recycle bin.");
        return;
      }

      const result = await getDeletedCaseRecords();
      if (isMounted) {
        setRecords(result);
        setMessage(
          isPersonalRecycleBin
            ? `${result.length} deleted case records loaded for ${user.displayName}.`
            : `${result.length} deleted case records loaded.`
        );
      }
    }

    void loadRecords();

    return () => {
      isMounted = false;
    };
  }, [hasPermission, isPersonalRecycleBin, user.displayName]);

  async function handleRestore(caseId: number) {
    setRestoringCaseId(caseId);
    await restoreCaseRecord(caseId);
    setRecords((current) => current.filter((record) => record.caseId !== caseId));
    setMessage(`Case ${caseId} restored to the active risk queue.`);
    setRestoringCaseId(null);
  }

  if (!hasPermission("CanDeleteCase")) {
    return (
      <div className="page-stack">
        <UsaBreadcrumb
          items={[
            { href: "/", label: "Home" },
            { href: "/risk-queue", label: "Risk queue" },
            { label: "Recycle bin" }
          ]}
        />
        <UsaAlert type="info" heading="Recycle bin unavailable">
          Current demo role cannot delete or restore case records.
        </UsaAlert>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <UsaBreadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/risk-queue", label: "Risk queue" },
          { label: "Recycle bin" }
        ]}
      />

      <p className="status-text" aria-live="polite">
        {message}
      </p>

      <section className="panel" aria-labelledby="recycle-bin-heading">
        <div className="section-header-row">
          <div>
            <h2 id="recycle-bin-heading">{isPersonalRecycleBin ? "My Deleted Case Records" : "Deleted Case Records"}</h2>
            <p className="status-text">
              {isPersonalRecycleBin
                ? "These are case records deleted by your current demo user. Restore returns them to the active queue."
                : "Deleted records are hidden from the active queue and reports until restored."}
            </p>
          </div>
          <UsaButton href="/risk-queue" variant="outline">
            Back to risk queue
          </UsaButton>
        </div>

        {records.length === 0 ? (
          <UsaAlert slim type="info">
            {isPersonalRecycleBin
              ? "Your recycle bin does not currently contain deleted case records."
              : "No deleted case records are currently in the recycle bin."}
          </UsaAlert>
        ) : (
          <UsaTable
            caption={isPersonalRecycleBin ? "Your deleted case records available for restore" : "Deleted case records available for restore"}
            rows={records}
            getRowKey={(record) => record.caseId}
            columns={[
              {
                key: "case",
                header: "Case",
                render: (record) => (
                  <>
                    <strong>Case {record.caseId}</strong>
                    <div className="status-text">Claim {record.claimId}</div>
                  </>
                )
              },
              {
                key: "provider",
                header: "Provider",
                render: (record) => record.providerName
              },
              {
                key: "risk",
                header: "Risk",
                render: (record) => (
                  <>
                    <strong>{record.riskLevel}</strong>
                    <div className="status-text">Score {record.riskScore}</div>
                  </>
                )
              },
              {
                key: "cost",
                header: "Questioned cost",
                render: (record) => preciseCurrencyFormatter.format(record.estimatedQuestionedCost)
              },
              {
                key: "deleted",
                header: "Deleted",
                render: (record) => (
                  <>
                    {formatDate(record.deletedAt)}
                    <div className="status-text">{record.deletedBy ?? "Unknown demo user"}</div>
                  </>
                )
              },
              {
                key: "actions",
                header: "Actions",
                render: (record) => (
                  <div className="action-row">
                    <UsaButton
                      disabled={restoringCaseId === record.caseId}
                      type="button"
                      onClick={() => void handleRestore(record.caseId)}
                    >
                      {restoringCaseId === record.caseId ? "Restoring..." : "Restore"}
                    </UsaButton>
                  </div>
                )
              }
            ]}
          />
        )}
      </section>
    </div>
  );
}
