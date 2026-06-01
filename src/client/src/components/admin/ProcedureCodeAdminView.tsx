"use client";

import { FormEvent, useEffect, useState } from "react";

import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { UsaTable } from "@/components/uswds/UsaTable";
import {
  addProcedureCode,
  getProcedureCodes,
  type ProcedureCode,
  updateProcedureCode
} from "@/lib/api-client";
import { useDemoUser } from "@/lib/demo-auth";
import { preciseCurrencyFormatter } from "@/lib/formatters";

const categories = ["Dental", "Imaging", "Physical Therapy", "Home Health", "Durable Medical Equipment", "Clinical Visit", "Chiropractic", "Transportation", "Pharmacy", "Therapy"];

const emptyProcedureCode: ProcedureCode = {
  procedureCodeId: 0,
  code: "",
  description: "",
  category: "Dental",
  defaultAmount: 0,
  isEnabled: true
};

export function ProcedureCodeAdminView() {
  const { hasPermission } = useDemoUser();
  const [procedureCodes, setProcedureCodes] = useState<ProcedureCode[]>([]);
  const [draft, setDraft] = useState<ProcedureCode>(emptyProcedureCode);
  const [message, setMessage] = useState("Loading procedure code reference data.");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const result = await getProcedureCodes(false);
      if (isMounted) {
        setProcedureCodes(result);
        setMessage(`${result.length} synthetic procedure codes loaded.`);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!hasPermission("CanManageProcedureCodes")) {
    return (
      <UsaAlert heading="Procedure code administration unavailable" type="warning">
        Switch to Supervisor or Administrator to manage synthetic procedure codes.
      </UsaAlert>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = {
      code: draft.code,
      description: draft.description,
      category: draft.category,
      defaultAmount: draft.defaultAmount,
      isEnabled: draft.isEnabled
    };
    const savedProcedureCode = draft.procedureCodeId
      ? await updateProcedureCode(draft.procedureCodeId, request)
      : await addProcedureCode(request);

    setProcedureCodes((current) => {
      const exists = current.some((procedureCode) => procedureCode.procedureCodeId === savedProcedureCode.procedureCodeId);
      return exists
        ? current.map((procedureCode) =>
            procedureCode.procedureCodeId === savedProcedureCode.procedureCodeId ? savedProcedureCode : procedureCode
          )
        : [savedProcedureCode, ...current];
    });
    setDraft(savedProcedureCode);
    setMessage(`${savedProcedureCode.code} saved.`);
  }

  return (
    <div className="page-stack">
      <UsaAlert slim type="info">
        Procedure code labels appear in intake dropdowns as code and meaning. Disabled procedure codes are hidden from
        active intake dropdowns.
      </UsaAlert>

      <section className="form-surface" aria-labelledby="procedure-code-form-heading">
        <h2 id="procedure-code-form-heading">{draft.procedureCodeId ? "Update Procedure Code" : "Add Procedure Code"}</h2>
        <p className="status-text" aria-live="polite">
          {message}
        </p>
        <form className="guided-form" onSubmit={handleSubmit}>
          <div className="guided-grid">
            <UsaFormGroup id="procedure-code" label="Procedure code">
              <input
                className="usa-input"
                id="procedure-code"
                required
                value={draft.code}
                onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="procedure-category" label="Category">
              <select
                className="usa-select"
                id="procedure-category"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </UsaFormGroup>
            <UsaFormGroup id="procedure-default-amount" label="Default amount (USD)">
              <input
                className="usa-input money-input"
                id="procedure-default-amount"
                inputMode="decimal"
                value={draft.defaultAmount?.toFixed(2) ?? ""}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    defaultAmount: event.target.value ? Number(event.target.value.replace(/[^\d.]/g, "")) : null
                  })
                }
              />
            </UsaFormGroup>
          </div>
          <UsaFormGroup id="procedure-description" label="Description">
            <input
              className="usa-input"
              id="procedure-description"
              required
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </UsaFormGroup>
          <div className="usa-checkbox">
            <input
              checked={draft.isEnabled}
              className="usa-checkbox__input"
              id="procedure-enabled"
              type="checkbox"
              onChange={(event) => setDraft({ ...draft, isEnabled: event.target.checked })}
            />
            <label className="usa-checkbox__label" htmlFor="procedure-enabled">
              Procedure code is active
            </label>
          </div>
          <div className="action-row">
            <UsaButton type="submit">Save procedure code</UsaButton>
            <UsaButton type="button" variant="outline" onClick={() => setDraft(emptyProcedureCode)}>
              New procedure code
            </UsaButton>
          </div>
        </form>
      </section>

      <UsaTable
        caption="Synthetic procedure code reference data"
        columns={[
          { key: "code", header: "Code", render: (row) => row.code },
          { key: "description", header: "Meaning", render: (row) => row.description },
          { key: "category", header: "Category", render: (row) => row.category },
          {
            key: "defaultAmount",
            header: "Default",
            render: (row) => (row.defaultAmount ? preciseCurrencyFormatter.format(row.defaultAmount) : "Not set")
          },
          { key: "active", header: "Active", render: (row) => (row.isEnabled ? "Yes" : "No") },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <UsaButton type="button" variant="outline" onClick={() => setDraft(row)}>
                Edit
              </UsaButton>
            )
          }
        ]}
        rows={procedureCodes}
        getRowKey={(row) => row.procedureCodeId}
      />
    </div>
  );
}
