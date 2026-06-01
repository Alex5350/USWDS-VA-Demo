"use client";

import { useEffect, useMemo, useState } from "react";

import { DownloadButton } from "@/components/layout/DownloadButton";
import { PowerBiReportFrame } from "@/components/reports/PowerBiReportFrame";
import { UsaTable } from "@/components/uswds/UsaTable";
import {
  type CaseAging,
  getCaseAgingReport,
  getProviderRiskCsv,
  getProviderRiskReport,
  getQuestionedCostTrend,
  getRiskQueueCsv,
  type ProviderRiskSummary,
  type QuestionedCostTrend
} from "@/lib/api-client";
import { currencyFormatter, numberFormatter, percentFormatter } from "@/lib/formatters";

export function ReportsView() {
  const [providerRisk, setProviderRisk] = useState<ProviderRiskSummary[]>([]);
  const [trend, setTrend] = useState<QuestionedCostTrend[]>([]);
  const [aging, setAging] = useState<CaseAging[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      const [providerResult, trendResult, agingResult] = await Promise.all([
        getProviderRiskReport(),
        getQuestionedCostTrend(),
        getCaseAgingReport()
      ]);

      if (isMounted) {
        setProviderRisk(providerResult);
        setTrend(trendResult);
        setAging(agingResult);
      }
    }

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const highestTrend = useMemo(
    () => trend.reduce((highest, item) => Math.max(highest, item.estimatedQuestionedCost), 1),
    [trend]
  );

  return (
    <div className="page-stack">
      <section aria-labelledby="powerbi-heading" className="panel">
        <h2 id="powerbi-heading">Power BI-Ready Report Slot</h2>
        <PowerBiReportFrame />
      </section>

      <section className="panel" aria-labelledby="exports-heading">
        <h2 id="exports-heading">Exports</h2>
        <p className="status-text">
          CSV exports use the API when available and fall back to synthetic client data during isolated frontend demos.
        </p>
        <div className="action-row">
          <DownloadButton fileName="risk-queue.csv" getBlob={getRiskQueueCsv}>
            Export risk queue CSV
          </DownloadButton>
          <DownloadButton fileName="provider-risk.csv" getBlob={getProviderRiskCsv}>
            Export provider risk CSV
          </DownloadButton>
        </div>
      </section>

      <section className="panel" aria-labelledby="provider-report-heading">
        <h2 id="provider-report-heading">Provider Risk Report</h2>
        <UsaTable
          caption="Provider risk report with claims, costs, and risk counts"
          columns={[
            { key: "provider", header: "Provider", render: (row) => row.providerName },
            { key: "type", header: "Type", render: (row) => row.providerType },
            { key: "state", header: "State", render: (row) => row.state },
            { key: "claims", header: "Claims", render: (row) => numberFormatter.format(row.claimCount) },
            { key: "paid", header: "Total paid", render: (row) => currencyFormatter.format(row.totalPaidAmount) },
            { key: "high", header: "High risk", render: (row) => numberFormatter.format(row.highRiskClaimCount) },
            {
              key: "critical",
              header: "Critical risk",
              render: (row) => numberFormatter.format(row.criticalRiskClaimCount)
            },
            {
              key: "questioned",
              header: "Estimated questioned cost",
              render: (row) => currencyFormatter.format(row.estimatedQuestionedCost)
            },
            {
              key: "average",
              header: "Average risk score",
              render: (row) => numberFormatter.format(row.averageRiskScore)
            }
          ]}
          rows={providerRisk}
          getRowKey={(row) => row.providerName}
        />
      </section>

      <section className="panel" aria-labelledby="trend-heading">
        <h2 id="trend-heading">Questioned Cost Trend</h2>
        <p className="status-text">
          Text summary: trend bars show relative estimated questioned cost by month; the table provides the exact values.
        </p>
        <ol className="trend-bars" aria-hidden="true">
          {trend.map((item) => (
            <li key={item.month}>
              <span>{item.month}</span>
              <div>
                <span style={{ width: `${percentFormatter.format(item.estimatedQuestionedCost / highestTrend)}` }} />
              </div>
              <strong>{currencyFormatter.format(item.estimatedQuestionedCost)}</strong>
            </li>
          ))}
        </ol>
        <UsaTable
          caption="Monthly paid amount, estimated questioned cost, high-risk claims, and case count"
          columns={[
            { key: "month", header: "Month", render: (row) => row.month },
            { key: "paid", header: "Total paid", render: (row) => currencyFormatter.format(row.totalPaidAmount) },
            {
              key: "questioned",
              header: "Estimated questioned cost",
              render: (row) => currencyFormatter.format(row.estimatedQuestionedCost)
            },
            { key: "high", header: "High-risk claims", render: (row) => numberFormatter.format(row.highRiskClaimCount) },
            { key: "cases", header: "Cases", render: (row) => numberFormatter.format(row.caseCount) }
          ]}
          rows={trend}
          getRowKey={(row) => row.month}
        />
      </section>

      <section className="panel" aria-labelledby="aging-heading">
        <h2 id="aging-heading">Case Aging Report</h2>
        <UsaTable
          caption="Case aging counts by status and age bucket"
          columns={[
            { key: "status", header: "Status", render: (row) => row.status },
            { key: "0-15", header: "0-15 days", render: (row) => numberFormatter.format(row.days0To15) },
            { key: "16-30", header: "16-30 days", render: (row) => numberFormatter.format(row.days16To30) },
            { key: "31-60", header: "31-60 days", render: (row) => numberFormatter.format(row.days31To60) },
            { key: "61+", header: "61+ days", render: (row) => numberFormatter.format(row.days61Plus) }
          ]}
          rows={aging}
          getRowKey={(row) => row.status}
        />
      </section>
    </div>
  );
}
