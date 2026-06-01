"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { SearchableSelect } from "@/components/uswds/SearchableSelect";
import {
  createRiskRecord,
  getProcedureCodes,
  getProviders,
  getRiskRules,
  getStates,
  type CreateRiskRecordResponse,
  type ProcedureCode,
  type Provider,
  type RiskRule,
  type StateTerritory
} from "@/lib/api-client";
import { useDemoUser } from "@/lib/demo-auth";
import { preciseCurrencyFormatter } from "@/lib/formatters";

type CreateRiskRecordFormProps = {
  onCreated?: (record: CreateRiskRecordResponse) => void;
};

export function CreateRiskRecordForm({ onCreated }: CreateRiskRecordFormProps = {}) {
  const { hasPermission } = useDemoUser();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [states, setStates] = useState<StateTerritory[]>([]);
  const [procedureCodes, setProcedureCodes] = useState<ProcedureCode[]>([]);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [providerId, setProviderId] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [procedureCodeId, setProcedureCodeId] = useState("");
  const [serviceDate, setServiceDate] = useState("2026-05-31");
  const [paidAmount, setPaidAmount] = useState("1250.00");
  const [assignedTo, setAssignedTo] = useState("Demo Analyst");
  const [narrativeSummary, setNarrativeSummary] = useState("");
  const [riskRuleIds, setRiskRuleIds] = useState<number[]>([]);
  const [message, setMessage] = useState("Complete the required selections below. Risk indicators remain review candidates, not determinations.");
  const [error, setError] = useState("");
  const [createdRecord, setCreatedRecord] = useState<CreateRiskRecordResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadReferenceData() {
      const [providerResult, stateResult, procedureResult, ruleResult] = await Promise.all([
        getProviders(true),
        getStates(),
        getProcedureCodes(true),
        getRiskRules()
      ]);

      if (isMounted) {
        setProviders(providerResult);
        setStates(stateResult);
        setProcedureCodes(procedureResult);
        setRules(ruleResult.filter((rule) => rule.isEnabled));

        const firstProvider = providerResult[0];
        const firstProcedure = procedureResult[0];
        setProviderId(firstProvider ? String(firstProvider.providerId) : "");
        setStateCode(firstProvider?.state ?? stateResult[0]?.code ?? "");
        setProcedureCodeId(firstProcedure ? String(firstProcedure.procedureCodeId) : "");
        if (firstProcedure?.defaultAmount) {
          setPaidAmount(firstProcedure.defaultAmount.toFixed(2));
        }
      }
    }

    void loadReferenceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const providerOptions = useMemo(
    () =>
      providers.map((provider) => ({
        value: String(provider.providerId),
        label: `${provider.providerName} (${provider.providerType}, ${provider.state})`,
        detail: `${provider.providerName} | ${provider.providerType} | NPI ${provider.npi} | ${provider.state} | ${provider.riskTier}`
      })),
    [providers]
  );

  const stateOptions = useMemo(
    () =>
      states.map((state) => ({
        value: state.code,
        label: `${state.code}: ${state.name}`,
        detail: `${state.name} (${state.type})`
      })),
    [states]
  );

  const procedureOptions = useMemo(
    () =>
      procedureCodes.map((procedureCode) => ({
        value: String(procedureCode.procedureCodeId),
        label: `${procedureCode.code}: ${procedureCode.description}`,
        detail: `${procedureCode.code} | ${procedureCode.category} | ${procedureCode.description}${
          procedureCode.defaultAmount ? ` | Default ${preciseCurrencyFormatter.format(procedureCode.defaultAmount)}` : ""
        }`
      })),
    [procedureCodes]
  );

  if (!hasPermission("CanCreateRiskRecord")) {
    return (
      <UsaAlert slim type="info">
        Current demo role can view the queue but cannot create manual triage records.
      </UsaAlert>
    );
  }

  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId);
    const nextProvider = providers.find((provider) => String(provider.providerId) === nextProviderId);
    if (nextProvider) {
      setStateCode(nextProvider.state);
    }
  }

  function handleProcedureChange(nextProcedureCodeId: string) {
    setProcedureCodeId(nextProcedureCodeId);
    const nextProcedure = procedureCodes.find(
      (procedureCode) => String(procedureCode.procedureCodeId) === nextProcedureCodeId
    );
    if (nextProcedure?.defaultAmount) {
      setPaidAmount(nextProcedure.defaultAmount.toFixed(2));
    }
  }

  function toggleRule(ruleId: number) {
    setRiskRuleIds((current) =>
      current.includes(ruleId) ? current.filter((selectedRuleId) => selectedRuleId !== ruleId) : [...current, ruleId]
    );
  }

  function normalizePaidAmount() {
    const parsedAmount = Number(paidAmount.replace(/[$,]/g, ""));
    if (Number.isFinite(parsedAmount) && parsedAmount > 0) {
      setPaidAmount(parsedAmount.toFixed(2));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedProviderId = Number(providerId);
    const parsedProcedureCodeId = Number(procedureCodeId);
    const parsedPaidAmount = Number(paidAmount.replace(/[$,]/g, ""));

    if (!parsedProviderId || !stateCode || !parsedProcedureCodeId || !Number.isFinite(parsedPaidAmount) || parsedPaidAmount <= 0) {
      setError("Select a provider, state or territory, procedure code, and valid paid amount.");
      return;
    }

    if (riskRuleIds.length === 0) {
      setError("Select at least one risk indicator.");
      return;
    }

    const record = await createRiskRecord({
      providerId: parsedProviderId,
      stateCode,
      procedureCodeId: parsedProcedureCodeId,
      serviceDate,
      paidAmount: Number(parsedPaidAmount.toFixed(2)),
      riskRuleIds,
      narrativeSummary,
      assignedTo
    });

    setMessage(`Created case ${record.caseId} with ${record.riskLevel} risk score ${record.riskScore}.`);
    setNarrativeSummary("");
    setRiskRuleIds([]);
    setCreatedRecord(record);
    onCreated?.(record);
  }

  return (
    <section className="form-surface intake-form" aria-labelledby="create-risk-record-heading">
      <h2 id="create-risk-record-heading">Intake Details</h2>
      <p className="status-text" aria-live="polite">
        {message}
      </p>
      {error ? (
        <UsaAlert slim type="error">
          {error}
        </UsaAlert>
      ) : null}
      {createdRecord ? (
        <UsaAlert heading={`Case ${createdRecord.caseId} created`} type="success">
          The synthetic review candidate is now available in the risk queue.{" "}
          <Link href={`/cases/${createdRecord.caseId}`}>Open case detail</Link>.
        </UsaAlert>
      ) : null}

      <form className="guided-form" onSubmit={handleSubmit}>
        <fieldset className="guided-step">
          <legend>
            <span>1</span> Provider and location
          </legend>
          <div className="guided-grid">
            <SearchableSelect
              id="new-provider"
              label="Provider name"
              options={providerOptions}
              required
              value={providerId}
              onChange={handleProviderChange}
            />
            <SearchableSelect
              id="new-state"
              label="State or territory"
              options={stateOptions}
              required
              value={stateCode}
              onChange={setStateCode}
            />
          </div>
        </fieldset>

        <fieldset className="guided-step">
          <legend>
            <span>2</span> Service and amount
          </legend>
          <div className="guided-grid service-grid">
            <SearchableSelect
              id="new-procedure-code"
              label="Procedure code"
              options={procedureOptions}
              required
              value={procedureCodeId}
              onChange={handleProcedureChange}
            />
            <UsaFormGroup id="new-service-date" label="Service date">
              <input
                className="usa-input"
                id="new-service-date"
                name="serviceDate"
                required
                type="date"
                value={serviceDate}
                onChange={(event) => setServiceDate(event.target.value)}
              />
            </UsaFormGroup>
            <UsaFormGroup id="new-paid-amount" label="Paid amount (USD)">
              <input
                className="usa-input money-input"
                id="new-paid-amount"
                inputMode="decimal"
                name="paidAmount"
                pattern="^\\$?\\d{1,9}(,\\d{3})*(\\.\\d{1,2})?$|^\\d{1,9}(\\.\\d{1,2})?$"
                required
                value={paidAmount}
                onBlur={normalizePaidAmount}
                onChange={(event) => setPaidAmount(event.target.value.replace(/[^\d.,$]/g, ""))}
              />
              <p className="field-detail">Accepts fractional U.S. dollars, for example 1250.75.</p>
            </UsaFormGroup>
          </div>
        </fieldset>

        <fieldset className="guided-step">
          <legend>
            <span>3</span> Assignment and risk indicators
          </legend>
          <div className="guided-grid guided-grid--narrow">
            <UsaFormGroup id="new-assigned-to" label="Assigned to">
              <input
                className="usa-input"
                id="new-assigned-to"
                name="assignedTo"
                value={assignedTo}
                onChange={(event) => setAssignedTo(event.target.value)}
              />
            </UsaFormGroup>
          </div>

          <fieldset className="usa-fieldset rule-checkbox-grid">
            <legend className="usa-legend">Risk indicators</legend>
            {rules.map((rule) => (
              <div className="usa-checkbox" key={rule.riskRuleId}>
                <input
                  checked={riskRuleIds.includes(rule.riskRuleId)}
                  className="usa-checkbox__input"
                  id={`manual-rule-${rule.riskRuleId}`}
                  name="riskRuleIds"
                  type="checkbox"
                  value={rule.riskRuleId}
                  onChange={() => toggleRule(rule.riskRuleId)}
                />
                <label className="usa-checkbox__label" htmlFor={`manual-rule-${rule.riskRuleId}`}>
                  {rule.ruleName} (+{rule.weight})
                </label>
              </div>
            ))}
          </fieldset>
        </fieldset>

        <fieldset className="guided-step">
          <legend>
            <span>4</span> Narrative and submission
          </legend>
          <UsaFormGroup id="new-narrative-summary" label="Narrative summary">
            <textarea
              className="usa-textarea narrative-textarea"
              id="new-narrative-summary"
              name="narrativeSummary"
              value={narrativeSummary}
              onChange={(event) => setNarrativeSummary(event.target.value)}
            />
          </UsaFormGroup>

          <div className="action-row">
            <UsaButton type="submit">Create review candidate</UsaButton>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
