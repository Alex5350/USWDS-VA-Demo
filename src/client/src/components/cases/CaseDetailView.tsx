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

export function CaseDetailView({ caseId }: CaseDetailViewProps) {
  const router = useRouter();
  const { user, hasPermission } = useDemoUser();
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
  const [status, setStatus] = useState("New");
  const [noteText, setNoteText] = useState("");
  const [message, setMessage] = useState("Loading case detail.");
  const [noteError, setNoteError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCase() {
      const result = await getCaseDetail(caseId);
      if (isMounted) {
        setCaseDetail(result);
        setStatus(result.status);
        setMessage("");
      }
    }

    void loadCase();

    return () => {
      isMounted = false;
    };
  }, [caseId]);

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!caseDetail || !hasPermission("CanChangeCaseStatus")) {
      return;
    }

    if (status === "Escalated") {
      await handleEscalate();
      return;
    }

    await updateCaseStatus(caseDetail.caseId, status);
    setCaseDetail({ ...caseDetail, status });
    setMessage(`Case status updated to ${status}.`);
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

  async function handleEscalate() {
    if (!caseDetail || !hasPermission("CanEscalateCase")) {
      return;
    }

    await escalateCase(caseDetail.caseId);
    setCaseDetail({ ...caseDetail, status: "Escalated", priority: "Critical" });
    setStatus("Escalated");
    setMessage("Case escalated for supervisory review.");
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
          {hasPermission("CanDeleteCase") ? (
            <Link className="usa-button usa-button--outline" href="/cases/recycle-bin">
              Recycle bin
            </Link>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="status-text" aria-live="polite">
          {message}
        </p>
      ) : null}

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

        <div className="panel no-print">
          <h2>Workflow Actions</h2>
          {!hasPermission("CanChangeCaseStatus") ? (
            <UsaAlert slim type="info">
              Current demo role can view case detail but cannot change status.
            </UsaAlert>
          ) : null}
          <form onSubmit={handleStatusSubmit}>
            <UsaFormGroup id="case-status" label="Case status">
              <select
                className="usa-select"
                disabled={!hasPermission("CanChangeCaseStatus")}
                id="case-status"
                name="case-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>New</option>
                <option>UnderReview</option>
                <option disabled={!hasPermission("CanEscalateCase")}>Escalated</option>
                <option disabled={!hasPermission("CanReferCase")}>Referred</option>
                <option>Closed</option>
              </select>
            </UsaFormGroup>
            <div className="action-row">
              <UsaButton disabled={!hasPermission("CanChangeCaseStatus")} type="submit">
                Update status
              </UsaButton>
              <UsaButton type="button" variant="outline" onClick={() => window.print()}>
                Print case
              </UsaButton>
              <UsaButton
                disabled={!hasPermission("CanEscalateCase") || caseDetail.status === "Escalated"}
                type="button"
                variant="outline"
                onClick={handleEscalate}
              >
                Escalate
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
          </form>
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
  );
}
