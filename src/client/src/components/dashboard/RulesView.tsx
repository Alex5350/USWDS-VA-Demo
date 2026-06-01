"use client";

import { useEffect, useState } from "react";

import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaTag } from "@/components/uswds/UsaTag";
import { getRiskRules, type RiskRule, updateRiskRule } from "@/lib/api-client";
import { useDemoUser } from "@/lib/demo-auth";

export function RulesView() {
  const { hasPermission } = useDemoUser();
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [message, setMessage] = useState("Loading risk rules.");
  const canEdit = hasPermission("CanEditRiskRules");

  useEffect(() => {
    let isMounted = true;

    async function loadRules() {
      const result = await getRiskRules();
      if (isMounted) {
        setRules(result);
        setMessage(`${result.length} deterministic risk rules loaded.`);
      }
    }

    void loadRules();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateLocalRule(ruleId: number, patch: Partial<RiskRule>) {
    setRules((currentRules) =>
      currentRules.map((rule) => (rule.riskRuleId === ruleId ? { ...rule, ...patch } : rule))
    );
  }

  async function handleSave(rule: RiskRule) {
    const result = await updateRiskRule(rule);
    updateLocalRule(rule.riskRuleId, result);
    setMessage(`${rule.ruleName} saved.`);
  }

  return (
    <div className="page-stack">
      <UsaAlert type={canEdit ? "info" : "warning"} slim>
        {canEdit
          ? "Administrator role can adjust demo rule weights and enabled status."
          : "Risk rules are visible to this role. Editing is restricted to Administrator."}
      </UsaAlert>
      <p className="status-text" aria-live="polite">
        {message}
      </p>

      <div className="table-scroll">
        <table className="usa-table usa-table--striped">
          <caption>Explainable deterministic risk scoring rules</caption>
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col">Description</th>
              <th scope="col">Weight</th>
              <th scope="col">Enabled</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.riskRuleId}>
                <th scope="row">
                  {rule.ruleName}
                  <div className="status-text">{rule.ruleCode}</div>
                </th>
                <td>{rule.description}</td>
                <td>
                  <label className="usa-sr-only" htmlFor={`weight-${rule.riskRuleId}`}>
                    Weight for {rule.ruleName}
                  </label>
                  <input
                    className="usa-input input-narrow"
                    disabled={!canEdit}
                    id={`weight-${rule.riskRuleId}`}
                    min="0"
                    max="100"
                    name={`weight-${rule.riskRuleId}`}
                    type="number"
                    value={rule.weight}
                    onChange={(event) => updateLocalRule(rule.riskRuleId, { weight: Number(event.target.value) })}
                  />
                </td>
                <td>
                  <label className="usa-checkbox">
                    <input
                      checked={rule.isEnabled}
                      className="usa-checkbox__input"
                      disabled={!canEdit}
                      id={`enabled-${rule.riskRuleId}`}
                      name={`enabled-${rule.riskRuleId}`}
                      type="checkbox"
                      onChange={(event) => updateLocalRule(rule.riskRuleId, { isEnabled: event.target.checked })}
                    />
                    <span className="usa-checkbox__label">
                      <UsaTag tone={rule.isEnabled ? "green" : "red"}>{rule.isEnabled ? "Enabled" : "Disabled"}</UsaTag>
                    </span>
                  </label>
                </td>
                <td>
                  <UsaButton disabled={!canEdit} onClick={() => void handleSave(rule)} type="button" variant="outline">
                    Save
                  </UsaButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
