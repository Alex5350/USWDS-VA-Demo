"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { RiskLevelTag } from "@/components/layout/RiskLevelTag";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaTable } from "@/components/uswds/UsaTable";
import {
  type CaseAging,
  type DashboardSummary,
  type ProviderRiskSummary,
  type QuestionedCostTrend,
  getCaseAgingReport,
  getDashboardSummary,
  getProviderRiskReport,
  getQuestionedCostTrend
} from "@/lib/api-client";
import { currencyFormatter, numberFormatter } from "@/lib/formatters";

const initialSummary: DashboardSummary = {
  totalClaimsReviewed: 0,
  highRiskClaims: 0,
  criticalRiskClaims: 0,
  estimatedQuestionedCost: 0,
  duplicatePaymentCandidates: 0,
  providersWithAbnormalPatterns: 0,
  openCases: 0,
  averageCaseAgeDays: 0
};

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1
});

function toChartNumber(value: unknown) {
  const parsedValue = Array.isArray(value) ? Number(value[0]) : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

const chartNumberFormatter = (value: unknown) => numberFormatter.format(toChartNumber(value));
const chartCurrencyFormatter = (value: unknown) => currencyFormatter.format(toChartNumber(value));
const chartCompactCurrencyFormatter = (value: unknown) => compactCurrencyFormatter.format(toChartNumber(value));

function formatCompactCurrency(value: number) {
  return Math.abs(value) < 1000 ? currencyFormatter.format(value) : compactCurrencyFormatter.format(value);
}

function formatTrendMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return month;
  }

  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function shortProviderName(providerName: string) {
  return providerName
    .replace("Demo Community ", "")
    .replace("Sample Regional ", "")
    .replace("Training ", "")
    .replace("Demo Provider Network ", "Network ");
}

type ExecutiveMetricProps = {
  href: string;
  label: string;
  value: string;
  detail: string;
  tone?: "critical" | "warning" | "neutral";
};

type ChartSize = {
  width: number;
  height: number;
};

type MeasuredChartFrameProps = {
  label: string;
  className?: string;
  fallback: string;
  children: (size: ChartSize) => ReactNode;
};

function MeasuredChartFrame({ label, className = "", fallback, children }: MeasuredChartFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }
    const measuredFrame = frame;

    function scheduleMeasure() {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = window.requestAnimationFrame(() => {
        const rect = measuredFrame.getBoundingClientRect();
        setSize({
          width: Math.max(Math.floor(rect.width), 0),
          height: Math.max(Math.floor(rect.height), 0)
        });
      });
    }

    scheduleMeasure();
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(measuredFrame);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const isReady = size.width > 0 && size.height > 0;

  return (
    <div className={`chart-frame ${className}`.trim()} ref={frameRef} role="img" aria-label={label}>
      {isReady ? children(size) : <div className="chart-placeholder">{fallback}</div>}
    </div>
  );
}

function ExecutiveMetric({ href, label, value, detail, tone = "neutral" }: ExecutiveMetricProps) {
  return (
    <Link className={`executive-kpi executive-kpi--${tone}`} href={href}>
      <span className="executive-kpi__label">{label}</span>
      <strong>{value}</strong>
      <span className="executive-kpi__detail">{detail}</span>
    </Link>
  );
}

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary);
  const [providers, setProviders] = useState<ProviderRiskSummary[]>([]);
  const [trend, setTrend] = useState<QuestionedCostTrend[]>([]);
  const [aging, setAging] = useState<CaseAging[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [summaryResult, providerResult, trendResult, agingResult] = await Promise.all([
        getDashboardSummary(),
        getProviderRiskReport(),
        getQuestionedCostTrend(),
        getCaseAgingReport()
      ]);

      if (isMounted) {
        setSummary(summaryResult);
        setProviders(providerResult);
        setTrend(trendResult);
        setAging(agingResult);
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const trendChart = useMemo(
    () =>
      trend.map((row) => ({
        ...row,
        monthLabel: formatTrendMonth(row.month)
      })),
    [trend]
  );

  const topProviderChart = useMemo(
    () =>
      providers.slice(0, 6).map((provider) => ({
        providerName: provider.providerName,
        shortName: shortProviderName(provider.providerName),
        questionedCost: provider.estimatedQuestionedCost,
        criticalClaims: provider.criticalRiskClaimCount,
        averageRiskScore: provider.averageRiskScore
      })),
    [providers]
  );

  const riskMix = useMemo(() => {
    const critical = summary.criticalRiskClaims;
    const high = summary.highRiskClaims;
    const other = Math.max(summary.totalClaimsReviewed - high - critical, 0);

    return [
      { name: "Critical", value: critical, fill: "#b50909" },
      { name: "High", value: high, fill: "#f9c642" },
      { name: "Other reviewed", value: other, fill: "#56b4e9" }
    ];
  }, [summary]);

  const agingChart = useMemo(
    () =>
      aging.map((row) => ({
        status: row.status,
        "0-15 days": row.days0To15,
        "16-30 days": row.days16To30,
        "31-60 days": row.days31To60,
        "61+ days": row.days61Plus
      })),
    [aging]
  );

  const priorityReviewCount = summary.highRiskClaims + summary.criticalRiskClaims;
  const questionedCostPerOpenCase =
    summary.openCases > 0 ? summary.estimatedQuestionedCost / summary.openCases : summary.estimatedQuestionedCost;

  return (
    <div className="executive-dashboard">
      <section className="executive-hero" aria-labelledby="executive-posture-heading">
        <div>
          <p className="page-eyebrow">Current oversight posture</p>
          <h2 id="executive-posture-heading">Review candidates are concentrated in provider pattern and cost indicators.</h2>
          <p>
            The dashboard summarizes synthetic Community Care claims for triage prioritization. It does not determine
            fraud, waste, or abuse.
          </p>
        </div>
        <dl className="executive-hero__stats">
          <div>
            <dt>Estimated questioned cost</dt>
            <dd>{currencyFormatter.format(summary.estimatedQuestionedCost)}</dd>
          </div>
          <div>
            <dt>Priority review candidates</dt>
            <dd>{numberFormatter.format(priorityReviewCount)}</dd>
          </div>
          <div>
            <dt>Estimated cost per open case</dt>
            <dd>{formatCompactCurrency(questionedCostPerOpenCase)}</dd>
          </div>
        </dl>
      </section>

      <section className="executive-kpi-grid" aria-label="Executive dashboard metrics">
        <ExecutiveMetric
          detail="Synthetic Community Care claims in the review population."
          href="/risk-queue"
          label="Claims reviewed"
          value={numberFormatter.format(summary.totalClaimsReviewed)}
        />
        <ExecutiveMetric
          detail="Records where analyst review is recommended first."
          href="/risk-queue?riskLevel=Critical"
          label="Critical-risk claims"
          tone="critical"
          value={numberFormatter.format(summary.criticalRiskClaims)}
        />
        <ExecutiveMetric
          detail="Review candidates scored as high-risk indicators."
          href="/risk-queue?riskLevel=High"
          label="High-risk claims"
          tone="warning"
          value={numberFormatter.format(summary.highRiskClaims)}
        />
        <ExecutiveMetric
          detail="Current open workload available for analyst triage."
          href="/risk-queue?status=New"
          label="Open cases"
          value={numberFormatter.format(summary.openCases)}
        />
      </section>

      <section className="executive-chart-grid" aria-label="Executive reporting visuals">
        <figure className="chart-panel chart-panel--wide">
          <div className="chart-panel__header">
            <div>
              <p className="page-eyebrow">Trend analysis</p>
              <h2>Questioned Cost Trend</h2>
            </div>
            <RiskLevelTag level="High" />
          </div>
          <MeasuredChartFrame fallback="Questioned cost chart loading." label="Area chart of estimated questioned cost by month">
            {({ width, height }) => (
                <AreaChart data={trendChart} height={height} margin={{ top: 10, right: 28, left: 4, bottom: 4 }} width={width}>
                  <defs>
                    <linearGradient id="questionedCostFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#005ea8" stopOpacity={0.42} />
                      <stop offset="95%" stopColor="#005ea8" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#dfe1e2" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="monthLabel" tickLine={false} />
                  <YAxis tickFormatter={chartCompactCurrencyFormatter} tickLine={false} width={64} />
                  <Tooltip formatter={chartCurrencyFormatter} labelFormatter={(label) => `Month: ${label}`} />
                  <Area
                    dataKey="estimatedQuestionedCost"
                    fill="url(#questionedCostFill)"
                    name="Estimated questioned cost"
                    stroke="#005ea8"
                    strokeWidth={3}
                    type="monotone"
                  />
                </AreaChart>
            )}
          </MeasuredChartFrame>
          <figcaption>
            Highest current monthly estimate:{" "}
            <strong>
              {trendChart.length > 0
                ? currencyFormatter.format(Math.max(...trendChart.map((row) => row.estimatedQuestionedCost)))
                : currencyFormatter.format(0)}
            </strong>
            .
          </figcaption>
        </figure>

        <figure className="chart-panel">
          <div className="chart-panel__header">
            <div>
              <p className="page-eyebrow">Risk mix</p>
              <h2>Review Priority</h2>
            </div>
          </div>
          <MeasuredChartFrame
            className="chart-frame--donut"
            fallback="Risk priority chart loading."
            label="Donut chart of claim review priority"
          >
            {({ width, height }) => (
                <PieChart height={height} width={width}>
                  <Tooltip formatter={chartNumberFormatter} />
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={riskMix}
                    dataKey="value"
                    innerRadius="58%"
                    nameKey="name"
                    outerRadius="84%"
                    paddingAngle={2}
                  >
                    {riskMix.map((entry) => (
                      <Cell fill={entry.fill} key={entry.name} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" />
                </PieChart>
            )}
          </MeasuredChartFrame>
          <figcaption>
            Critical and high records are review candidates only, not determinations of misconduct.
          </figcaption>
        </figure>
      </section>

      <section className="executive-chart-grid executive-chart-grid--balanced" aria-label="Provider and workload visuals">
        <figure className="chart-panel chart-panel--wide">
          <div className="chart-panel__header">
            <div>
              <p className="page-eyebrow">Provider reporting</p>
              <h2>Top Providers by Estimated Questioned Cost</h2>
            </div>
            <UsaButton href="/reports" variant="outline">
              Open reports
            </UsaButton>
          </div>
          <MeasuredChartFrame fallback="Provider chart loading." label="Horizontal bar chart of provider questioned cost">
            {({ width, height }) => (
                <BarChart
                  data={topProviderChart}
                  height={height}
                  layout="vertical"
                  margin={{ top: 4, right: 28, left: 40, bottom: 4 }}
                  width={width}
                >
                  <CartesianGrid stroke="#dfe1e2" strokeDasharray="4 4" horizontal={false} />
                  <XAxis tickFormatter={chartCompactCurrencyFormatter} type="number" />
                  <YAxis dataKey="shortName" tickLine={false} type="category" width={118} />
                  <Tooltip formatter={chartCurrencyFormatter} />
                  <Bar dataKey="questionedCost" fill="#2e8540" name="Estimated questioned cost" radius={[0, 6, 6, 0]} />
                </BarChart>
            )}
          </MeasuredChartFrame>
          <figcaption>Provider bars are sorted by estimated questioned cost from SQL-backed report data.</figcaption>
        </figure>

        <figure className="chart-panel">
          <div className="chart-panel__header">
            <div>
              <p className="page-eyebrow">Workload aging</p>
              <h2>Case Aging</h2>
            </div>
          </div>
          <MeasuredChartFrame fallback="Case aging chart loading." label="Stacked bar chart of case aging by status">
            {({ width, height }) => (
                <BarChart data={agingChart} height={height} margin={{ top: 12, right: 8, left: 4, bottom: 4 }} width={width}>
                  <CartesianGrid stroke="#dfe1e2" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} />
                  <YAxis tickFormatter={chartNumberFormatter} tickLine={false} />
                  <Tooltip formatter={chartNumberFormatter} />
                  <Legend />
                  <Bar dataKey="0-15 days" fill="#2e8540" stackId="age" />
                  <Bar dataKey="16-30 days" fill="#56b4e9" stackId="age" />
                  <Bar dataKey="31-60 days" fill="#f9c642" stackId="age" />
                  <Bar dataKey="61+ days" fill="#b50909" stackId="age" />
                </BarChart>
            )}
          </MeasuredChartFrame>
          <figcaption>Average open case age is {summary.averageCaseAgeDays.toFixed(1)} days.</figcaption>
        </figure>
      </section>

      <div className="action-row">
        <UsaButton href="/risk-queue?riskLevel=High">Open high-risk queue</UsaButton>
        <UsaButton href="/reports" variant="outline">
          Review reporting
        </UsaButton>
      </div>

      <section className="section-grid compact-report-table" aria-labelledby="dashboard-provider-heading">
        <h2 id="dashboard-provider-heading">Provider Risk Detail</h2>
        <UsaTable
          caption="Provider risk summary sorted by estimated questioned cost"
          columns={[
            { key: "providerName", header: "Provider", render: (row) => row.providerName },
            { key: "providerType", header: "Type", render: (row) => row.providerType },
            { key: "state", header: "State", render: (row) => row.state },
            { key: "claims", header: "Claims", render: (row) => numberFormatter.format(row.claimCount) },
            { key: "critical", header: "Critical", render: (row) => numberFormatter.format(row.criticalRiskClaimCount) },
            {
              key: "questionedCost",
              header: "Estimated questioned cost",
              render: (row) => currencyFormatter.format(row.estimatedQuestionedCost)
            }
          ]}
          rows={providers.slice(0, 10)}
          getRowKey={(row) => row.providerName}
        />
      </section>

      <section className="report-grid" aria-label="Accessible chart data tables">
        <div className="panel">
          <h2>Questioned Cost Data</h2>
          <p className="status-text">
            Accessible table equivalent for the questioned cost trend chart.
          </p>
          <UsaTable
            caption="Estimated questioned cost by month"
            columns={[
              { key: "month", header: "Month", render: (row) => row.month },
              { key: "paid", header: "Total paid", render: (row) => currencyFormatter.format(row.totalPaidAmount) },
              {
                key: "questioned",
                header: "Estimated questioned cost",
                render: (row) => currencyFormatter.format(row.estimatedQuestionedCost)
              },
              { key: "cases", header: "Cases", render: (row) => numberFormatter.format(row.caseCount) }
            ]}
            rows={trend}
            getRowKey={(row) => row.month}
          />
        </div>

        <div className="panel">
          <h2>Case Aging Data</h2>
          <p className="status-text">Accessible table equivalent for the case aging chart.</p>
          <UsaTable
            caption="Case aging by workflow status"
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
        </div>
      </section>
    </div>
  );
}
