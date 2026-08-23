"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaBreadcrumb } from "@/components/uswds/UsaBreadcrumb";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { type CaseDetail, getCaseDetail, updateCaseRecord } from "@/lib/api-client";
import { useDemoUser } from "@/lib/demo-auth";

type CaseEditViewProps = {
  caseId: number;
};

type CaseEditDraft = {
  status: string;
  assignedTo: string;
  priority: string;
  estimatedQuestionedCost: string;
  procedureCode: string;
  serviceDate: string;
  submittedDate: string;
  paidDate: string;
  claimAmount: string;
  paidAmount: string;
  claimStatus: string;
};

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function toMoneyInputValue(value: number) {
  return value.toFixed(2);
}

function createCaseEditDraft(caseDetail: CaseDetail): CaseEditDraft {
  return {
    status: caseDetail.status,
    assignedTo: caseDetail.assignedTo ?? "",
    priority: caseDetail.priority,
    estimatedQuestionedCost: toMoneyInputValue(caseDetail.estimatedQuestionedCost),
    procedureCode: caseDetail.claim.procedureCode,
    serviceDate: toDateInputValue(caseDetail.claim.serviceDate),
    submittedDate: toDateInputValue(caseDetail.claim.submittedDate),
    paidDate: toDateInputValue(caseDetail.claim.paidDate),
    claimAmount: toMoneyInputValue(caseDetail.claim.claimAmount),
    paidAmount: toMoneyInputValue(caseDetail.claim.paidAmount),
    claimStatus: caseDetail.claim.claimStatus
  };
}

function parseMoney(value: string) {
  return Number(value.replace(/[$,]/g, ""));
}

function normalizeMoneyInput(value: string) {
  return value.replace(/[^\d.,$]/g, "");
}

export function CaseEditView({ caseId }: CaseEditViewProps) {
  const router = useRouter();
  const { hasPermission } = useDemoUser();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [editDraft, setEditDraft] = useState<CaseEditDraft | null>(null);
  const [message, setMessage] = useState("Loading case record.");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCase() {
      const result = await getCaseDetail(caseId);
      if (isMounted) {
        setCaseDetail(result);
        setEditDraft(createCaseEditDraft(result));
        setMessage(`Editing Case ${result.caseId}.`);
      }
    }

    void loadCase();

    return () => {
      isMounted = false;
    };
  }, [caseId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!caseDetail || !editDraft || !hasPermission("CanEditCase")) {
      return;
    }

    const claimAmount = parseMoney(editDraft.claimAmount);
    const paidAmount = parseMoney(editDraft.paidAmount);
    const estimatedQuestionedCost = parseMoney(editDraft.estimatedQuestionedCost);

    if ([claimAmount, paidAmount, estimatedQuestionedCost].some((value) => !Number.isFinite(value) || value < 0)) {
      setError("Amounts must be valid non-negative U.S. dollar values.");
      return;
    }

    if (editDraft.status === "Escalated" && caseDetail.status !== "Escalated") {
      setError("Use the case detail Escalate action so the required justification is recorded.");
      return;
    }

    if (caseDetail.status === "Escalated" && editDraft.status !== "Escalated") {
      setError("Use the case detail De-escalate action so the required justification is recorded.");
      return;
    }

    const updated = await updateCaseRecord(caseDetail.caseId, {
      status: editDraft.status,
      assignedTo: editDraft.assignedTo.trim() || null,
      priority: editDraft.priority,
      estimatedQuestionedCost,
      procedureCode: editDraft.procedureCode.trim(),
      serviceDate: editDraft.serviceDate,
      submittedDate: editDraft.submittedDate,
      paidDate: editDraft.paidDate || null,
      claimAmount,
      paidAmount,
      claimStatus: editDraft.claimStatus.trim()
    });

    setError("");
    router.push(`/cases/${updated.caseId}`);
  }

  if (!hasPermission("CanEditCase")) {
    return (
      <div className="page-stack">
        <UsaBreadcrumb
          items={[
            { href: "/", label: "Home" },
            { href: "/risk-queue", label: "Risk queue" },
            { href: `/cases/${caseId}`, label: `Case ${caseId}` },
            { label: "Edit" }
          ]}
        />
        <UsaAlert type="info" heading="Read-only access">
          Current demo role can view case detail but cannot edit case records.
        </UsaAlert>
        <div className="action-row">
          <UsaButton href={`/cases/${caseId}`} variant="outline">
            Back to case detail
          </UsaButton>
        </div>
      </div>
    );
  }

  if (!caseDetail || !editDraft) {
    return (
      <div className="page-stack">
        <p className="status-text" aria-live="polite">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <UsaBreadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/risk-queue", label: "Risk queue" },
          { href: `/cases/${caseDetail.caseId}`, label: `Case ${caseDetail.caseId}` },
          { label: "Edit" }
        ]}
      />

      <section className="panel no-print" aria-labelledby="edit-case-heading">
        <h2 id="edit-case-heading">Edit Case Record</h2>
        <p className="status-text" aria-live="polite">
          {message}
        </p>
        <p className="status-text">
          Update the editable case, status, and claim fields. Escalation changes still use the dedicated case detail
          actions so a justification is saved. Provider and procedure-code reference data are managed from their
          administration pages.
        </p>
        {error ? (
          <UsaAlert slim type="error">
            {error}
          </UsaAlert>
        ) : null}
        <form className="guided-form" onSubmit={handleSubmit}>
          <div className="guided-grid">
            <UsaFormGroup id="edit-case-status" label="Case status">
              <select
                className="usa-select"
                disabled={!hasPermission("CanChangeCaseStatus")}
                id="edit-case-status"
                value={editDraft.status}
                onChange={(event) => setEditDraft({ ...editDraft, status: event.target.value })}
              >
                <option>New</option>
                <option>UnderReview</option>
                {caseDetail.status === "Escalated" ? <option>Escalated</option> : null}
                <option disabled={!hasPermission("CanReferCase")}>Referred</option>
                <option>Closed</option>
              </select>
              <p className="field-detail">
                Escalated status is controlled by the Escalate and De-escalate actions on the case detail page.
              </p>
            </UsaFormGroup>
            <UsaFormGroup id="edit-assigned-to" label="Assigned to">
              <input
                className="usa-input"
                id="edit-assigned-to"
                value={editDraft.assignedTo}
                onChange={(event) => setEditDraft({ ...editDraft, assignedTo: event.target.value })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-priority" label="Priority">
              <select
                className="usa-select"
                id="edit-priority"
                value={editDraft.priority}
                onChange={(event) => setEditDraft({ ...editDraft, priority: event.target.value })}
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </UsaFormGroup>
            <UsaFormGroup id="edit-estimated-questioned-cost" label="Estimated questioned cost">
              <input
                className="usa-input money-input"
                id="edit-estimated-questioned-cost"
                inputMode="decimal"
                value={editDraft.estimatedQuestionedCost}
                onChange={(event) =>
                  setEditDraft({ ...editDraft, estimatedQuestionedCost: normalizeMoneyInput(event.target.value) })
                }
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-procedure-code" label="Claim procedure code">
              <input
                className="usa-input"
                id="edit-procedure-code"
                required
                value={editDraft.procedureCode}
                onChange={(event) => setEditDraft({ ...editDraft, procedureCode: event.target.value })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-service-date" label="Service date">
              <input
                className="usa-input"
                id="edit-service-date"
                required
                type="date"
                value={editDraft.serviceDate}
                onChange={(event) => setEditDraft({ ...editDraft, serviceDate: event.target.value })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-submitted-date" label="Submitted date">
              <input
                className="usa-input"
                id="edit-submitted-date"
                required
                type="date"
                value={editDraft.submittedDate}
                onChange={(event) => setEditDraft({ ...editDraft, submittedDate: event.target.value })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-paid-date" label="Paid date">
              <input
                className="usa-input"
                id="edit-paid-date"
                type="date"
                value={editDraft.paidDate}
                onChange={(event) => setEditDraft({ ...editDraft, paidDate: event.target.value })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-claim-amount" label="Claim amount">
              <input
                className="usa-input money-input"
                id="edit-claim-amount"
                inputMode="decimal"
                required
                value={editDraft.claimAmount}
                onChange={(event) => setEditDraft({ ...editDraft, claimAmount: normalizeMoneyInput(event.target.value) })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-paid-amount" label="Paid amount">
              <input
                className="usa-input money-input"
                id="edit-paid-amount"
                inputMode="decimal"
                required
                value={editDraft.paidAmount}
                onChange={(event) => setEditDraft({ ...editDraft, paidAmount: normalizeMoneyInput(event.target.value) })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="edit-claim-status" label="Claim status">
              <input
                className="usa-input"
                id="edit-claim-status"
                required
                value={editDraft.claimStatus}
                onChange={(event) => setEditDraft({ ...editDraft, claimStatus: event.target.value })}
              />
            </UsaFormGroup>
          </div>
          <div className="action-row">
            <UsaButton type="submit">Save case record</UsaButton>
            <UsaButton href={`/cases/${caseDetail.caseId}`} variant="outline">
              Cancel
            </UsaButton>
          </div>
        </form>
      </section>
    </div>
  );
}
