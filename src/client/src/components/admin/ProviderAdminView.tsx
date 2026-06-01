"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { SearchableSelect } from "@/components/uswds/SearchableSelect";
import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { UsaTable } from "@/components/uswds/UsaTable";
import {
  addProvider,
  getProviders,
  getStates,
  type Provider,
  type StateTerritory,
  updateProvider
} from "@/lib/api-client";
import { useDemoUser } from "@/lib/demo-auth";

const providerTypes = ["Dental", "Imaging", "Physical Therapy", "Home Health", "Durable Medical Equipment", "Behavioral Health", "Chiropractic", "Transportation"];
const riskTiers = ["Standard", "Medium", "Elevated", "High"];

const emptyProvider: Provider = {
  providerId: 0,
  providerName: "",
  npi: "",
  providerType: "Dental",
  state: "VA",
  riskTier: "Standard",
  isEnabled: true
};

export function ProviderAdminView() {
  const { hasPermission } = useDemoUser();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [states, setStates] = useState<StateTerritory[]>([]);
  const [draft, setDraft] = useState<Provider>(emptyProvider);
  const [message, setMessage] = useState("Loading provider reference data.");

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [providerResult, stateResult] = await Promise.all([getProviders(false), getStates()]);
      if (isMounted) {
        setProviders(providerResult);
        setStates(stateResult);
        setMessage(`${providerResult.length} synthetic providers loaded.`);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const stateOptions = useMemo(
    () =>
      states.map((state) => ({
        value: state.code,
        label: `${state.code}: ${state.name}`,
        detail: `${state.name} (${state.type})`
      })),
    [states]
  );

  if (!hasPermission("CanManageProviders")) {
    return (
      <UsaAlert heading="Provider administration unavailable" type="warning">
        Switch to Investigator, Supervisor, or Administrator to manage synthetic providers.
      </UsaAlert>
    );
  }

  function resetForm() {
    setDraft(emptyProvider);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const request = {
      providerName: draft.providerName,
      npi: draft.npi,
      providerType: draft.providerType,
      state: draft.state,
      riskTier: draft.riskTier,
      isEnabled: draft.isEnabled
    };
    const savedProvider = draft.providerId
      ? await updateProvider(draft.providerId, request)
      : await addProvider(request);

    setProviders((current) => {
      const exists = current.some((provider) => provider.providerId === savedProvider.providerId);
      return exists
        ? current.map((provider) => (provider.providerId === savedProvider.providerId ? savedProvider : provider))
        : [savedProvider, ...current];
    });
    setDraft(savedProvider);
    setMessage(`${savedProvider.providerName} saved.`);
  }

  return (
    <div className="page-stack">
      <UsaAlert slim type="info">
        Provider records are synthetic reference data for the demo. Disabled providers are hidden from active intake
        dropdowns.
      </UsaAlert>

      <section className="form-surface" aria-labelledby="provider-form-heading">
        <h2 id="provider-form-heading">{draft.providerId ? "Update Provider" : "Add Provider"}</h2>
        <p className="status-text" aria-live="polite">
          {message}
        </p>
        <form className="guided-form" onSubmit={handleSubmit}>
          <div className="guided-grid">
            <UsaFormGroup id="provider-name" label="Provider name">
              <input
                className="usa-input"
                id="provider-name"
                required
                value={draft.providerName}
                onChange={(event) => setDraft({ ...draft, providerName: event.target.value })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="provider-npi" label="NPI">
              <input
                className="usa-input"
                id="provider-npi"
                required
                value={draft.npi}
                onChange={(event) => setDraft({ ...draft, npi: event.target.value })}
              />
            </UsaFormGroup>
            <UsaFormGroup id="provider-type" label="Provider type">
              <select
                className="usa-select"
                id="provider-type"
                value={draft.providerType}
                onChange={(event) => setDraft({ ...draft, providerType: event.target.value })}
              >
                {providerTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </UsaFormGroup>
            <SearchableSelect
              id="provider-state"
              label="State or territory"
              options={stateOptions}
              required
              value={draft.state}
              onChange={(state) => setDraft({ ...draft, state })}
            />
            <UsaFormGroup id="provider-risk-tier" label="Risk tier">
              <select
                className="usa-select"
                id="provider-risk-tier"
                value={draft.riskTier}
                onChange={(event) => setDraft({ ...draft, riskTier: event.target.value })}
              >
                {riskTiers.map((tier) => (
                  <option key={tier}>{tier}</option>
                ))}
              </select>
            </UsaFormGroup>
          </div>
          <div className="usa-checkbox">
            <input
              checked={draft.isEnabled}
              className="usa-checkbox__input"
              id="provider-enabled"
              type="checkbox"
              onChange={(event) => setDraft({ ...draft, isEnabled: event.target.checked })}
            />
            <label className="usa-checkbox__label" htmlFor="provider-enabled">
              Provider is active
            </label>
          </div>
          <div className="action-row">
            <UsaButton type="submit">Save provider</UsaButton>
            <UsaButton type="button" variant="outline" onClick={resetForm}>
              New provider
            </UsaButton>
          </div>
        </form>
      </section>

      <UsaTable
        caption="Synthetic provider reference data"
        columns={[
          { key: "name", header: "Provider", render: (row) => row.providerName },
          { key: "type", header: "Type", render: (row) => row.providerType },
          { key: "state", header: "State", render: (row) => row.state },
          { key: "tier", header: "Risk tier", render: (row) => row.riskTier },
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
        rows={providers}
        getRowKey={(row) => row.providerId}
      />
    </div>
  );
}
