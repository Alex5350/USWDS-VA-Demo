"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { RiskLevelTag } from "@/components/layout/RiskLevelTag";
import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaBreadcrumb } from "@/components/uswds/UsaBreadcrumb";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { UsaTag } from "@/components/uswds/UsaTag";
import {
  addCaseNote,
  deEscalateCase,
  deleteCaseRecord,
  escalateCase,
  type CaseDetail,
  getCaseDetail,
  updateCaseStatus
} from "@/lib/api-client";
import { useDemoUser } from "@/lib/demo-auth";
import { formatDate, preciseCurrencyFormatter } from "@/lib/formatters";

type CaseDetailViewProps = {
  caseId: number;
};

type EscalationAction = "escalate" | "de-escalate";

export function CaseDetailView({ caseId }: CaseDetailViewProps) {
  const router = useRouter();
  const { user, hasPermission } = useDemoUser();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [noteText, setNoteText] = useState("");
  const [message, setMessage] = useState("Loading case detail.");
  const [noteError, setNoteError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [escalationAction, setEscalationAction] = useState<EscalationAction | null>(null);
  const [escalationJustification, setEscalationJustification] = useState("");
  const [escalationError, setEscalationError] = useState("");
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCase() {
      const result = await getCaseDetail(caseId);
      if (isMounted) {
        setCaseDetail(result);
        setMessage("");
      }
    }

    void loadCase();

    return () => {
      isMounted = false;
    };
  }, [caseId]);

  async function handleStatusChange(nextStatus: string) {
    if (!caseDetail || !hasPermission("CanChangeCaseStatus")) {
      return;
    }

    if (nextStatus === caseDetail.status) {
      return;
    }

    if (caseDetail.status === "Escalated" && nextStatus !== "Escalated") {
      openEscalationDialog("de-escalate");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await updateCaseStatus(caseDetail.caseId, nextStatus);
      const refreshed = await getCaseDetail(caseDetail.caseId);
      setCaseDetail(refreshed);
      setMessage(`Case status changed to ${nextStatus}.`);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleNoteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!caseDetail || !hasPermission("CanAddCaseNote")) {
      return;
    }

    if (!noteText.trim()) {
      setNoteError("Enter a case note before submitting.");
      return;
    }

    await addCaseNote(caseDetail.caseId, noteText.trim(), user.displayName);
    setCaseDetail({
      ...caseDetail,
      notes: [
        {
          noteId: Date.now(),
          createdBy: user.displayName,
          createdDate: new Date().toISOString().slice(0, 10),
          noteText: noteText.trim()
        },
        ...caseDetail.notes
      ]
    });
    setNoteText("");
    setNoteError("");
    setMessage("Case note added.");
  }

  function openEscalationDialog(action: EscalationAction) {
    if (!caseDetail || !hasPermission("CanEscalateCase")) {
      return;
    }

    setEscalationAction(action);
    setEscalationJustification("");
    setEscalationError("");
  }

  async function handleEscalationSubmit() {
    if (!caseDetail || !escalationAction || !hasPermission("CanEscalateCase")) {
      return;
    }

    const justification = escalationJustification.trim();
    if (!justification) {
      setEscalationError("Enter a justification before submitting.");
      return;
    }

    setIsSubmittingEscalation(true);
    try {
      if (escalationAction === "escalate") {
        await escalateCase(caseDetail.caseId, justification);
      } else {
        await deEscalateCase(caseDetail.caseId, justification);
      }

      const refreshed = await getCaseDetail(caseDetail.caseId);
      setCaseDetail(refreshed);
      setMessage(
        escalationAction === "escalate"
          ? "Case escalated with justification recorded."
          : "Case de-escalated with justification recorded."
      );
      setEscalationAction(null);
      setEscalationJustification("");
      setEscalationError("");
    } catch {
      setEscalationError("The workflow action could not be saved. Try again.");
    } finally {
      setIsSubmittingEscalation(false);
    }
  }

  function openDeleteDialog() {
    if (!caseDetail || !hasPermission("CanDeleteCase")) {
      return;
    }

    setIsDeleteDialogOpen(true);
  }

  async function handleDeleteCase() {
    if (!caseDetail || !hasPermission("CanDeleteCase")) {
      return;
    }

    setIsDeleting(true);
    await deleteCaseRecord(caseDetail.caseId);
    router.push("/cases/recycle-bin");
  }

  if (!caseDetail) {
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
          { label: `Case ${caseDetail.caseId}` }
        ]}
      />

      {hasPermission("CanCreateCaseRecord") ? (
        <div className="page-header-actions no-print" aria-label="Case record actions">
          <Link className="usa-button" href="/cases/new">
            Create case record
          </Link>
          <Link className="usa-button usa-button--outline" href="/risk-queue">
            Back to risk queue
          </Link>
        </div>
      ) : null}

      {message ? (
        <p className="status-text status-text--live no-print" aria-live="polite">
          {message}
        </p>
      ) : null}

      <CasePrintReport caseDetail={caseDetail} />

      <div className="case-detail-screen page-stack">
      <section className="case-summary" aria-labelledby="case-summary-heading">
        <div>
          <h2 id="case-summary-heading">Case Summary</h2>
          <dl className="detail-list">
            <div>
              <dt>Case ID</dt>
              <dd>{caseDetail.caseId}</dd>
            </div>
            <div>
              <dt>Claim ID</dt>
              <dd>{caseDetail.claimId}</dd>
            </div>
            <div>
              <dt>Risk level</dt>
              <dd>
                <RiskLevelTag level={caseDetail.riskLevel} />
              </dd>
            </div>
            <div>
              <dt>Risk score</dt>
              <dd>{caseDetail.riskScore}</dd>
            </div>
            <div>
              <dt>Estimated questioned cost</dt>
              <dd>{preciseCurrencyFormatter.format(caseDetail.estimatedQuestionedCost)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <UsaTag tone="blue">{caseDetail.status}</UsaTag>
              </dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>{caseDetail.assignedTo ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(caseDetail.createdDate)}</dd>
            </div>
          </dl>
        </div>

        <div className="panel workflow-panel no-print">
          <h2>Workflow Actions</h2>
          {!hasPermission("CanChangeCaseStatus") ? (
            <UsaAlert slim type="info">
              Current demo role can view case detail but cannot change status.
            </UsaAlert>
          ) : null}
          <div className="workflow-current-status">
            <span>Current status</span>
            <UsaTag tone="blue">{caseDetail.status}</UsaTag>
          </div>
          <p className="workflow-help">
            Status buttons save immediately. Escalation changes require a justification before they are saved.
          </p>

          <div className="workflow-action-group">
            <h3>Review status</h3>
            <div className="action-row workflow-button-row">
              <UsaButton
                disabled={
                  !hasPermission("CanChangeCaseStatus") ||
                  isUpdatingStatus ||
                  caseDetail.status === "UnderReview" ||
                  caseDetail.status === "Escalated"
                }
                type="button"
                variant="outline"
                onClick={() => void handleStatusChange("UnderReview")}
              >
                Mark under review
              </UsaButton>
              <UsaButton
                disabled={
                  !hasPermission("CanReferCase") ||
                  isUpdatingStatus ||
                  caseDetail.status === "Referred" ||
                  caseDetail.status === "Escalated"
                }
                type="button"
                variant="outline"
                onClick={() => void handleStatusChange("Referred")}
              >
                Refer case
              </UsaButton>
              <UsaButton
                disabled={
                  !hasPermission("CanChangeCaseStatus") ||
                  isUpdatingStatus ||
                  caseDetail.status === "Closed" ||
                  caseDetail.status === "Escalated"
                }
                type="button"
                variant="outline"
                onClick={() => void handleStatusChange("Closed")}
              >
                Close case
              </UsaButton>
            </div>
            {caseDetail.status === "Escalated" ? (
              <p className="workflow-help">Use De-escalate before applying routine review-status changes.</p>
            ) : null}
          </div>

          <div className="workflow-action-group">
            <h3>Escalation</h3>
            <div className="action-row workflow-button-row">
              <UsaButton
                disabled={!hasPermission("CanEscalateCase") || caseDetail.status === "Escalated"}
                type="button"
                variant="outline"
                onClick={() => openEscalationDialog("escalate")}
              >
                Escalate
              </UsaButton>
              <UsaButton
                disabled={!hasPermission("CanEscalateCase") || caseDetail.status !== "Escalated"}
                type="button"
                variant="outline"
                onClick={() => openEscalationDialog("de-escalate")}
              >
                De-escalate
              </UsaButton>
            </div>
          </div>

          <div className="workflow-action-group">
            <h3>Record actions</h3>
            <div className="action-row workflow-button-row">
              <UsaButton type="button" variant="outline" onClick={() => window.print()}>
                Print report
              </UsaButton>
              {hasPermission("CanEditCase") ? (
                <UsaButton href={`/cases/${caseDetail.caseId}/edit`} variant="outline">
                  Edit case
                </UsaButton>
              ) : (
                <UsaButton disabled type="button" variant="outline">
                  Edit case
                </UsaButton>
              )}
              <UsaButton disabled={!hasPermission("CanDeleteCase")} type="button" variant="outline" onClick={openDeleteDialog}>
                Delete case
              </UsaButton>
            </div>
          </div>
          {!hasPermission("CanDeleteCase") ? (
            <p className="status-text">Current demo role cannot delete case records.</p>
          ) : null}
        </div>
      </section>

      {isDeleteDialogOpen ? (
        <div className="modal-scrim" role="presentation">
          <section
            aria-labelledby="delete-case-dialog-heading"
            aria-modal="true"
            className="confirm-dialog"
            role="dialog"
          >
            <div className="confirm-dialog__header">
              <p className="page-eyebrow">Delete case record</p>
              <h2 id="delete-case-dialog-heading">Delete Case {caseDetail.caseId}?</h2>
            </div>
            <p>
              This action removes the case from the active risk queue and reports. The underlying synthetic claim, notes,
              and findings are retained.
            </p>
            <dl className="confirm-dialog__facts">
              <div>
                <dt>Provider</dt>
                <dd>{caseDetail.provider.providerName}</dd>
              </div>
              <div>
                <dt>Questioned cost</dt>
                <dd>{preciseCurrencyFormatter.format(caseDetail.estimatedQuestionedCost)}</dd>
              </div>
              <div>
                <dt>Risk level</dt>
                <dd>{caseDetail.riskLevel}</dd>
              </div>
            </dl>
            <div className="action-row confirm-dialog__actions">
              <UsaButton disabled={isDeleting} type="button" variant="secondary" onClick={handleDeleteCase}>
                {isDeleting ? "Deleting..." : "Delete"}
              </UsaButton>
              <UsaButton disabled={isDeleting} type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </UsaButton>
            </div>
          </section>
        </div>
      ) : null}

      {escalationAction ? (
        <div className="modal-scrim" role="presentation">
          <section
            aria-labelledby="escalation-dialog-heading"
            aria-modal="true"
            className="confirm-dialog"
            role="dialog"
          >
            <div className="confirm-dialog__header">
              <p className="page-eyebrow">Workflow justification</p>
              <h2 id="escalation-dialog-heading">
                {escalationAction === "escalate"
                  ? `Escalate Case ${caseDetail.caseId}?`
                  : `De-escalate Case ${caseDetail.caseId}?`}
              </h2>
            </div>
            <p>
              Enter the rationale for this workflow decision. The justification will be saved to the case notes and audit
              history.
            </p>
            <dl className="confirm-dialog__facts">
              <div>
                <dt>Current status</dt>
                <dd>{caseDetail.status}</dd>
              </div>
              <div>
                <dt>Risk score</dt>
                <dd>{caseDetail.riskScore}</dd>
              </div>
              <div>
                <dt>Assigned to</dt>
                <dd>{caseDetail.assignedTo ?? "Unassigned"}</dd>
              </div>
            </dl>
            <UsaFormGroup id="escalation-justification" label="Justification" error={escalationError}>
              <textarea
                aria-describedby={escalationError ? "escalation-justification-error" : undefined}
                autoFocus
                className="usa-textarea"
                id="escalation-justification"
                rows={4}
                value={escalationJustification}
                onChange={(event) => {
                  setEscalationJustification(event.target.value);
                  setEscalationError("");
                }}
              />
            </UsaFormGroup>
            <div className="action-row confirm-dialog__actions">
              <UsaButton disabled={isSubmittingEscalation} type="button" onClick={handleEscalationSubmit}>
                {isSubmittingEscalation
                  ? "Saving..."
                  : escalationAction === "escalate"
                    ? "Escalate"
                    : "De-escalate"}
              </UsaButton>
              <UsaButton
                disabled={isSubmittingEscalation}
                type="button"
                variant="outline"
                onClick={() => {
                  setEscalationAction(null);
                }}
              >
                Cancel
              </UsaButton>
            </div>
          </section>
        </div>
      ) : null}

      <section className="detail-grid" aria-label="Claim, provider, and authorization details">
        <div className="panel">
          <h2>Claim Details</h2>
          <dl className="detail-list">
            <div>
              <dt>Procedure</dt>
              <dd>{caseDetail.claim.procedureCode}</dd>
            </div>
            <div>
              <dt>Service date</dt>
              <dd>{formatDate(caseDetail.claim.serviceDate)}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatDate(caseDetail.claim.submittedDate)}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>{formatDate(caseDetail.claim.paidDate)}</dd>
            </div>
            <div>
              <dt>Paid amount</dt>
              <dd>{preciseCurrencyFormatter.format(caseDetail.claim.paidAmount)}</dd>
            </div>
            <div>
              <dt>Claim status</dt>
              <dd>{caseDetail.claim.claimStatus}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h2>Provider Details</h2>
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{caseDetail.provider.providerName}</dd>
            </div>
            <div>
              <dt>NPI</dt>
              <dd>{caseDetail.provider.npi}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{caseDetail.provider.providerType}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{caseDetail.provider.state}</dd>
            </div>
            <div>
              <dt>Risk tier</dt>
              <dd>{caseDetail.provider.riskTier}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h2>Authorization Details</h2>
          {caseDetail.authorization ? (
            <dl className="detail-list">
              <div>
                <dt>Authorization ID</dt>
                <dd>{caseDetail.authorization.authorizationId}</dd>
              </div>
              <div>
                <dt>Procedure</dt>
                <dd>{caseDetail.authorization.procedureCode}</dd>
              </div>
              <div>
                <dt>Date range</dt>
                <dd>
                  {formatDate(caseDetail.authorization.startDate)} to {formatDate(caseDetail.authorization.endDate)}
                </dd>
              </div>
              <div>
                <dt>Authorized amount</dt>
                <dd>{preciseCurrencyFormatter.format(caseDetail.authorization.authorizedAmount)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{caseDetail.authorization.status}</dd>
              </div>
            </dl>
          ) : (
            <UsaAlert slim type="warning">
              No matching authorization is attached to this synthetic claim.
            </UsaAlert>
          )}
        </div>
      </section>

      <section className="panel" aria-labelledby="risk-findings-heading">
        <h2 id="risk-findings-heading">Explainable Risk Findings</h2>
        <div className="table-scroll">
          <table className="usa-table usa-table--striped">
            <caption>Risk rules that contributed to the case score</caption>
            <thead>
              <tr>
                <th scope="col">Rule</th>
                <th scope="col">Contribution</th>
                <th scope="col">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {caseDetail.riskFindings.map((finding) => (
                <tr key={finding.riskFindingId}>
                  <th scope="row">
                    {finding.ruleName}
                    <div className="status-text">{finding.ruleCode}</div>
                  </th>
                  <td>+{finding.scoreContribution}</td>
                  <td>{finding.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-grid" aria-label="Related complaints and analyst notes">
        <div className="panel">
          <h2>Related Hotline Complaints</h2>
          {caseDetail.complaints.length > 0 ? (
            <ul className="usa-list">
              {caseDetail.complaints.map((complaint) => (
                <li key={complaint.complaintId}>
                  <strong>{complaint.complaintType}</strong> ({formatDate(complaint.receivedDate)}):{" "}
                  {complaint.narrativeSummary} Status: {complaint.status}.
                </li>
              ))}
            </ul>
          ) : (
            <p>No related synthetic hotline complaints are linked to this case.</p>
          )}
        </div>

        <div className="panel">
          <h2>Analyst Notes</h2>
          <form className="no-print" onSubmit={handleNoteSubmit}>
            <UsaFormGroup id="case-note" label="Add case note" error={noteError}>
              <textarea
                aria-describedby={noteError ? "case-note-error" : undefined}
                className="usa-textarea"
                disabled={!hasPermission("CanAddCaseNote")}
                id="case-note"
                name="case-note"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
              />
            </UsaFormGroup>
            <UsaButton disabled={!hasPermission("CanAddCaseNote")} type="submit">
              Add note
            </UsaButton>
          </form>
          {!hasPermission("CanAddCaseNote") ? (
            <UsaAlert slim type="info">
              Current demo role cannot add notes.
            </UsaAlert>
          ) : null}
          <ul className="note-list">
            {caseDetail.notes.map((note) => (
              <li key={note.noteId}>
                <strong>{note.createdBy}</strong> on {formatDate(note.createdDate)}
                <p>{note.noteText}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      </div>
    </div>
  );
}

function CasePrintReport({ caseDetail }: { caseDetail: CaseDetail }) {
  return (
    <section className="case-print-report print-only" aria-label={`Printable report for Case ${caseDetail.caseId}`}>
      <header className="case-print-report__header">
        <div>
          <p className="case-print-report__eyebrow">VA OIG FWA Risk Triage Demo</p>
          <h1>Case {caseDetail.caseId} Review Report</h1>
          <p>
            Synthetic-data case report for analyst review. Risk indicators are review candidates, not determinations of
            fraud, waste, abuse, or misconduct.
          </p>
        </div>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{caseDetail.status}</dd>
          </div>
          <div>
            <dt>Risk level</dt>
            <dd>{caseDetail.riskLevel}</dd>
          </div>
          <div>
            <dt>Risk score</dt>
            <dd>{caseDetail.riskScore}</dd>
          </div>
        </dl>
      </header>

      <section className="case-print-section" aria-labelledby="print-summary-heading">
        <h2 id="print-summary-heading">Case Summary</h2>
        <dl className="case-print-facts">
          <div>
            <dt>Case ID</dt>
            <dd>{caseDetail.caseId}</dd>
          </div>
          <div>
            <dt>Claim ID</dt>
            <dd>{caseDetail.claimId}</dd>
          </div>
          <div>
            <dt>Assigned to</dt>
            <dd>{caseDetail.assignedTo ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDate(caseDetail.createdDate)}</dd>
          </div>
          <div>
            <dt>Estimated questioned cost</dt>
            <dd>{preciseCurrencyFormatter.format(caseDetail.estimatedQuestionedCost)}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{caseDetail.provider.providerName}</dd>
          </div>
        </dl>
      </section>

      <section className="case-print-section case-print-section-grid" aria-label="Claim and provider details">
        <div>
          <h2>Claim Details</h2>
          <dl className="case-print-facts case-print-facts--compact">
            <div>
              <dt>Procedure</dt>
              <dd>{caseDetail.claim.procedureCode}</dd>
            </div>
            <div>
              <dt>Service date</dt>
              <dd>{formatDate(caseDetail.claim.serviceDate)}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatDate(caseDetail.claim.submittedDate)}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>{formatDate(caseDetail.claim.paidDate)}</dd>
            </div>
            <div>
              <dt>Claim amount</dt>
              <dd>{preciseCurrencyFormatter.format(caseDetail.claim.claimAmount)}</dd>
            </div>
            <div>
              <dt>Paid amount</dt>
              <dd>{preciseCurrencyFormatter.format(caseDetail.claim.paidAmount)}</dd>
            </div>
            <div>
              <dt>Claim status</dt>
              <dd>{caseDetail.claim.claimStatus}</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2>Provider Details</h2>
          <dl className="case-print-facts case-print-facts--compact">
            <div>
              <dt>Name</dt>
              <dd>{caseDetail.provider.providerName}</dd>
            </div>
            <div>
              <dt>NPI</dt>
              <dd>{caseDetail.provider.npi}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{caseDetail.provider.providerType}</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>{caseDetail.provider.state}</dd>
            </div>
            <div>
              <dt>Risk tier</dt>
              <dd>{caseDetail.provider.riskTier}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="case-print-section" aria-labelledby="print-authorization-heading">
        <h2 id="print-authorization-heading">Authorization Details</h2>
        {caseDetail.authorization ? (
          <dl className="case-print-facts">
            <div>
              <dt>Authorization ID</dt>
              <dd>{caseDetail.authorization.authorizationId}</dd>
            </div>
            <div>
              <dt>Procedure</dt>
              <dd>{caseDetail.authorization.procedureCode}</dd>
            </div>
            <div>
              <dt>Date range</dt>
              <dd>
                {formatDate(caseDetail.authorization.startDate)} to {formatDate(caseDetail.authorization.endDate)}
              </dd>
            </div>
            <div>
              <dt>Authorized amount</dt>
              <dd>{preciseCurrencyFormatter.format(caseDetail.authorization.authorizedAmount)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{caseDetail.authorization.status}</dd>
            </div>
          </dl>
        ) : (
          <p>No matching authorization is attached to this synthetic claim.</p>
        )}
      </section>

      <section className="case-print-section" aria-labelledby="print-findings-heading">
        <h2 id="print-findings-heading">Explainable Risk Findings</h2>
        <table className="case-print-table">
          <caption>Risk rules that contributed to the case score</caption>
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col">Contribution</th>
              <th scope="col">Explanation</th>
            </tr>
          </thead>
          <tbody>
            {caseDetail.riskFindings.map((finding) => (
              <tr key={finding.riskFindingId}>
                <th scope="row">
                  {finding.ruleName}
                  <span>{finding.ruleCode}</span>
                </th>
                <td>+{finding.scoreContribution}</td>
                <td>{finding.explanation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="case-print-section case-print-section-grid" aria-label="Complaints and notes">
        <div>
          <h2>Related Hotline Complaints</h2>
          {caseDetail.complaints.length > 0 ? (
            <ul className="case-print-list">
              {caseDetail.complaints.map((complaint) => (
                <li key={complaint.complaintId}>
                  <strong>{complaint.complaintType}</strong> ({formatDate(complaint.receivedDate)}):{" "}
                  {complaint.narrativeSummary} Status: {complaint.status}.
                </li>
              ))}
            </ul>
          ) : (
            <p>No related synthetic hotline complaints are linked to this case.</p>
          )}
        </div>
        <div>
          <h2>Analyst Notes</h2>
          {caseDetail.notes.length > 0 ? (
            <ul className="case-print-list">
              {caseDetail.notes.map((note) => (
                <li key={note.noteId}>
                  <strong>{note.createdBy}</strong> on {formatDate(note.createdDate)}: {note.noteText}
                </li>
              ))}
            </ul>
          ) : (
            <p>No case notes are recorded.</p>
          )}
        </div>
      </section>
    </section>
  );
}
