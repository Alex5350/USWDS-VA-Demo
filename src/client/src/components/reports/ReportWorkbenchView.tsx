"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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

import { DownloadButton } from "@/components/layout/DownloadButton";
import { RiskLevelTag } from "@/components/layout/RiskLevelTag";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { UsaPagination } from "@/components/uswds/UsaPagination";
import { UsaTable } from "@/components/uswds/UsaTable";
import { useDemoUser } from "@/lib/demo-auth";
import {
  type CaseAging,
  type PaginatedResponse,
  type Provider,
  type ProviderRiskSummary,
  type QuestionedCostTrend,
  type ReportFilters,
  type ReportSummary,
  type StateTerritory,
  getCaseAgingCsv,
  getCaseAgingReport,
  getProviderRiskCsv,
  getProviderRiskReport,
  getProviderRiskReportPage,
  getProviders,
  getQuestionedCostTrend,
  getQuestionedCostTrendCsv,
  getReportSummary,
  getRiskQueueCsv,
  getStates
} from "@/lib/api-client";
import { currencyFormatter, numberFormatter } from "@/lib/formatters";

type ReportKind = "command-center" | "provider-risk" | "questioned-cost" | "case-aging";

type ReportWorkbenchViewProps = {
  kind: ReportKind;
};

type ChartSize = {
  width: number;
  height: number;
};

type MeasuredChartFrameProps = {
  label: string;
  fallback: string;
  className?: string;
  children: (size: ChartSize) => ReactNode;
};

const defaultFilters: ReportFilters = {
  fromDate: "2026-01-01",
  toDate: "2026-05-31",
  status: "All",
  riskLevel: "All",
  providerId: "All",
  providerType: "All",
  state: "All",
  search: "",
  page: 1,
  pageSize: 5
};

const providerRiskDetailPageSizeOptions = [5, 10, 15, 20, 25, 50];

const emptyProviderRiskPage: PaginatedResponse<ProviderRiskSummary> = {
  items: [],
  totalItems: 0,
  page: 1,
  pageSize: 5,
  totalPages: 1
};

const emptySummary: ReportSummary = {
  claimsReviewed: 0,
  reviewCandidates: 0,
  criticalCases: 0,
  estimatedQuestionedCost: 0,
  providerCount: 0,
  averageRiskScore: 0,
  openCases: 0
};

const providerTypes = [
  "Dental",
  "Imaging",
  "Physical Therapy",
  "Home Health",
  "Durable Medical Equipment",
  "Behavioral Health",
  "Chiropractic"
];

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1
});

const reportMetadata: Record<ReportKind, { eyebrow: string; title: string; description: string; csvName: string }> = {
  "command-center": {
    eyebrow: "Reporting command center",
    title: "Oversight Reporting Command Center",
    description: "Filtered reporting workspace for executive summaries, provider concentration, questioned cost trends, and case aging.",
    csvName: "risk-queue-report.csv"
  },
  "provider-risk": {
    eyebrow: "Provider intelligence",
    title: "Provider Risk Concentration",
    description: "Filter provider-level claim volume, estimated questioned cost, critical case counts, and average risk score.",
    csvName: "provider-risk-report.csv"
  },
  "questioned-cost": {
    eyebrow: "Financial trend analysis",
    title: "Questioned Cost Trend",
    description: "Analyze estimated questioned cost movement over time with date, status, provider, type, and state filters.",
    csvName: "questioned-cost-trend-report.csv"
  },
  "case-aging": {
    eyebrow: "Workload aging",
    title: "Case Aging and Workflow Load",
    description: "Expose case aging by workflow status so leaders can see where triage workload is accumulating.",
    csvName: "case-aging-report.csv"
  }
};

type QueryReader = {
  get(name: string): string | null;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function filtersFromQuery(searchParams: QueryReader): ReportFilters {
  return {
    fromDate: searchParams.get("fromDate") ?? defaultFilters.fromDate,
    toDate: searchParams.get("toDate") ?? defaultFilters.toDate,
    status: searchParams.get("status") ?? defaultFilters.status,
    riskLevel: searchParams.get("riskLevel") ?? defaultFilters.riskLevel,
    providerId: searchParams.get("providerId") ?? defaultFilters.providerId,
    providerType: searchParams.get("providerType") ?? defaultFilters.providerType,
    state: searchParams.get("state") ?? defaultFilters.state,
    search: searchParams.get("search") ?? defaultFilters.search,
    page: parsePositiveInt(searchParams.get("page"), defaultFilters.page ?? 1),
    pageSize: parsePositiveInt(searchParams.get("pageSize"), defaultFilters.pageSize ?? 5)
  };
}

function toChartNumber(value: unknown) {
  const parsedValue = Array.isArray(value) ? Number(value[0]) : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

const chartNumberFormatter = (value: unknown) => numberFormatter.format(toChartNumber(value));
const chartCurrencyFormatter = (value: unknown) => currencyFormatter.format(toChartNumber(value));
const chartCompactCurrencyFormatter = (value: unknown) => compactCurrencyFormatter.format(toChartNumber(value));

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

function compactCurrency(value: number) {
  return Math.abs(value) < 1000 ? currencyFormatter.format(value) : compactCurrencyFormatter.format(value);
}

function createProviderLabel(provider: Provider) {
  return `${provider.providerName} (${provider.providerType}, ${provider.state})`;
}

function MeasuredChartFrame({ label, fallback, className = "", children }: MeasuredChartFrameProps) {
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

  return (
    <div className={`chart-frame ${className}`.trim()} ref={frameRef} role="img" aria-label={label}>
      {size.width > 0 && size.height > 0 ? children(size) : <div className="chart-placeholder">{fallback}</div>}
    </div>
  );
}

function applyFilters(filters: ReportFilters) {
  return {
    ...filters,
    providerId: filters.providerId === "All" ? undefined : filters.providerId
  };
}

function ReportStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="report-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function ReportWorkbenchView({ kind }: ReportWorkbenchViewProps) {
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromQuery(searchParams), [searchParams]);

  return <ReportWorkbenchContent key={searchParams.toString()} kind={kind} filters={filters} />;
}

type ReportWorkbenchContentProps = ReportWorkbenchViewProps & {
  filters: ReportFilters;
};

function ReportWorkbenchContent({ kind, filters }: ReportWorkbenchContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const metadata = reportMetadata[kind];
  const { hasPermission } = useDemoUser();
  const canExport = hasPermission("CanExportReports");
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(filters);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [states, setStates] = useState<StateTerritory[]>([]);
  const [summary, setSummary] = useState<ReportSummary>(emptySummary);
  const [providerRisk, setProviderRisk] = useState<ProviderRiskSummary[]>([]);
  const [providerRiskPage, setProviderRiskPage] = useState<PaginatedResponse<ProviderRiskSummary>>(emptyProviderRiskPage);
  const [trend, setTrend] = useState<QuestionedCostTrend[]>([]);
  const [aging, setAging] = useState<CaseAging[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading reporting data.");

  function createReportHref(nextFilters: ReportFilters) {
    const params = new URLSearchParams();
    const page = nextFilters.page ?? defaultFilters.page ?? 1;
    const pageSize = nextFilters.pageSize ?? defaultFilters.pageSize ?? 5;

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    ([
      ["fromDate", nextFilters.fromDate, defaultFilters.fromDate],
      ["toDate", nextFilters.toDate, defaultFilters.toDate],
      ["status", nextFilters.status, defaultFilters.status],
      ["riskLevel", nextFilters.riskLevel, defaultFilters.riskLevel],
      ["providerId", nextFilters.providerId, defaultFilters.providerId],
      ["providerType", nextFilters.providerType, defaultFilters.providerType],
      ["state", nextFilters.state, defaultFilters.state],
      ["search", nextFilters.search, defaultFilters.search]
    ] as const).forEach(([key, value, defaultValue]) => {
      if (value !== undefined && value !== "" && value !== defaultValue) {
        params.set(key, String(value));
      }
    });

    return `${pathname}?${params.toString()}`;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadReferenceData() {
      const [providerResult, stateResult] = await Promise.all([getProviders(true), getStates()]);
      if (isMounted) {
        setProviders(providerResult);
        setStates(stateResult);
      }
    }

    void loadReferenceData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const activeFilters = applyFilters(filters);

    async function loadReports() {
      setStatusMessage("Loading reporting data.");
      const [summaryResult, providerResult, providerPageResult, trendResult, agingResult] = await Promise.all([
        getReportSummary(activeFilters),
        getProviderRiskReport(activeFilters),
        getProviderRiskReportPage(activeFilters),
        getQuestionedCostTrend(activeFilters),
        getCaseAgingReport(activeFilters)
      ]);

      if (isMounted) {
        setSummary(summaryResult);
        setProviderRisk(providerResult);
        setProviderRiskPage(providerPageResult);
        setTrend(trendResult);
        setAging(agingResult);
        setStatusMessage(
          `Reporting data loaded with current filters. Detail table page ${providerPageResult.page} of ${providerPageResult.totalPages}.`
        );
      }
    }

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const trendChart = useMemo(
    () =>
      trend.map((row) => ({
        ...row,
        monthLabel: formatTrendMonth(row.month)
      })),
    [trend]
  );

  const providerChart = useMemo(
    () =>
      providerRisk.slice(0, 8).map((provider) => ({
        ...provider,
        shortName: shortProviderName(provider.providerName)
      })),
    [providerRisk]
  );

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

  const statusMix = useMemo(
    () =>
      aging.map((row, index) => ({
        name: row.status,
        value: row.days0To15 + row.days16To30 + row.days31To60 + row.days61Plus,
        fill: ["#005ea8", "#ffbe2e", "#2e8540", "#b50909", "#565c65"][index % 5]
      })),
    [aging]
  );

  const activeFilters = applyFilters(filters);
  const getCsv = () => {
    if (kind === "provider-risk") {
      return getProviderRiskCsv(activeFilters);
    }

    if (kind === "questioned-cost") {
      return getQuestionedCostTrendCsv(activeFilters);
    }

    if (kind === "case-aging") {
      return getCaseAgingCsv(activeFilters);
    }

    return getRiskQueueCsv(activeFilters);
  };

  function updateDraftFilter(key: keyof ReportFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setDraftFilters(defaultFilters);
    router.push(createReportHref(defaultFilters));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(
      createReportHref({
        ...draftFilters,
        page: 1,
        pageSize: filters.pageSize ?? defaultFilters.pageSize
      })
    );
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div className="page-stack report-workbench">
      <section className="report-command-hero print-report-section" aria-labelledby="report-workbench-heading">
        <div>
          <p className="page-eyebrow">{metadata.eyebrow}</p>
          <h2 id="report-workbench-heading">{metadata.title}</h2>
          <p>{metadata.description}</p>
        </div>
        <dl className="report-command-hero__facts">
          <div>
            <dt>Claims reviewed</dt>
            <dd>{numberFormatter.format(summary.claimsReviewed)}</dd>
          </div>
          <div>
            <dt>Estimated questioned cost</dt>
            <dd>{compactCurrency(summary.estimatedQuestionedCost)}</dd>
          </div>
          <div>
            <dt>Open cases</dt>
            <dd>{numberFormatter.format(summary.openCases)}</dd>
          </div>
        </dl>
      </section>

      <form className="report-filter-card no-print" onSubmit={handleSubmit}>
        <fieldset className="usa-fieldset">
          <legend className="usa-legend">Report filters</legend>
          <p className="filter-panel-intro">
            Filter by date range, workflow status, provider, provider type, state or territory, and provider search.
          </p>
          <div className="report-filter-grid">
            <UsaFormGroup id="report-from-date" label="From date">
              <input
                className="usa-input"
                id="report-from-date"
                name="fromDate"
                type="date"
                value={draftFilters.fromDate}
                onChange={(event) => updateDraftFilter("fromDate", event.target.value)}
              />
            </UsaFormGroup>
            <UsaFormGroup id="report-to-date" label="To date">
              <input
                className="usa-input"
                id="report-to-date"
                name="toDate"
                type="date"
                value={draftFilters.toDate}
                onChange={(event) => updateDraftFilter("toDate", event.target.value)}
              />
            </UsaFormGroup>
            <UsaFormGroup id="report-status" label="Case status">
              <select
                className="usa-select"
                id="report-status"
                name="status"
                value={draftFilters.status}
                onChange={(event) => updateDraftFilter("status", event.target.value)}
              >
                <option>All</option>
                <option>New</option>
                <option>UnderReview</option>
                <option>Escalated</option>
                <option>Referred</option>
                <option>Closed</option>
              </select>
            </UsaFormGroup>
            <UsaFormGroup id="report-risk-level" label="Risk level">
              <select
                className="usa-select"
                id="report-risk-level"
                name="riskLevel"
                value={draftFilters.riskLevel}
                onChange={(event) => updateDraftFilter("riskLevel", event.target.value)}
              >
                <option>All</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </UsaFormGroup>
            <UsaFormGroup id="report-provider" label="Provider">
              <select
                className="usa-select"
                id="report-provider"
                name="providerId"
                value={draftFilters.providerId}
                onChange={(event) => updateDraftFilter("providerId", event.target.value)}
              >
                <option value="All">All providers</option>
                {providers.map((provider) => (
                  <option key={provider.providerId} value={provider.providerId}>
                    {createProviderLabel(provider)}
                  </option>
                ))}
              </select>
            </UsaFormGroup>
            <UsaFormGroup id="report-provider-type" label="Provider type">
              <select
                className="usa-select"
                id="report-provider-type"
                name="providerType"
                value={draftFilters.providerType}
                onChange={(event) => updateDraftFilter("providerType", event.target.value)}
              >
                <option>All</option>
                {providerTypes.map((providerType) => (
                  <option key={providerType}>{providerType}</option>
                ))}
              </select>
            </UsaFormGroup>
            <UsaFormGroup id="report-state" label="State or territory">
              <select
                className="usa-select"
                id="report-state"
                name="state"
                value={draftFilters.state}
                onChange={(event) => updateDraftFilter("state", event.target.value)}
              >
                <option>All</option>
                {states.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.code}: {state.name}
                  </option>
                ))}
              </select>
            </UsaFormGroup>
            <UsaFormGroup id="report-provider-search" label="Provider search">
              <input
                className="usa-input"
                id="report-provider-search"
                name="search"
                type="search"
                value={draftFilters.search}
                onChange={(event) => updateDraftFilter("search", event.target.value)}
              />
            </UsaFormGroup>
          </div>
          <div className="report-action-strip">
            <UsaButton type="submit">Apply filters</UsaButton>
            <UsaButton type="button" variant="outline" onClick={resetFilters}>
              Reset
            </UsaButton>
          </div>
        </fieldset>
      </form>

      <section className="report-export-panel no-print" aria-labelledby="report-export-heading">
        <div>
          <p className="page-eyebrow">Export package</p>
          <h2 id="report-export-heading">Filtered Report Exports</h2>
          <p>
            {canExport
              ? "CSV and PDF exports use the current filter set. PDF export opens a print-ready report view."
              : "Your current demo role can view reports but cannot export report packages."}
          </p>
        </div>
        {canExport ? (
          <div className="report-export-panel__actions">
            <DownloadButton fileName={metadata.csvName} getBlob={getCsv}>
              Export CSV
            </DownloadButton>
            <UsaButton type="button" variant="outline" onClick={exportPdf}>
              Export PDF
            </UsaButton>
          </div>
        ) : null}
      </section>

      <p className="status-text no-print" aria-live="polite">
        {statusMessage}
      </p>

      <section className="report-stat-grid print-report-section" aria-label="Filtered report headline metrics">
        <ReportStat
          detail="Claims matching current filters"
          label="Claims reviewed"
          value={numberFormatter.format(summary.claimsReviewed)}
        />
        <ReportStat
          detail="Cases created from risk indicators"
          label="Review candidates"
          value={numberFormatter.format(summary.reviewCandidates)}
        />
        <ReportStat
          detail="Critical review priority"
          label="Critical cases"
          value={numberFormatter.format(summary.criticalCases)}
        />
        <ReportStat
          detail="Mean score across filtered cases"
          label="Average risk score"
          value={numberFormatter.format(summary.averageRiskScore)}
        />
      </section>

      {(kind === "command-center" || kind === "questioned-cost") && (
        <section className="report-visual-grid print-report-section" aria-labelledby="trend-visual-heading">
          <figure className="chart-panel chart-panel--wide">
            <div className="chart-panel__header">
              <div>
                <p className="page-eyebrow">Financial trend</p>
                <h2 id="trend-visual-heading">Estimated Questioned Cost Over Time</h2>
              </div>
              <RiskLevelTag level="High" />
            </div>
            <MeasuredChartFrame fallback="Questioned cost trend loading." label="Area chart of estimated questioned cost by month">
              {({ width, height }) => (
                <AreaChart data={trendChart} height={height} margin={{ top: 12, right: 24, left: 4, bottom: 4 }} width={width}>
                  <defs>
                    <linearGradient id="reportQuestionedCost" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#005ea8" stopOpacity={0.44} />
                      <stop offset="95%" stopColor="#005ea8" stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#dfe1e2" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="monthLabel" tickLine={false} />
                  <YAxis tickFormatter={chartCompactCurrencyFormatter} tickLine={false} width={68} />
                  <Tooltip formatter={chartCurrencyFormatter} labelFormatter={(label) => `Month: ${label}`} />
                  <Area
                    dataKey="estimatedQuestionedCost"
                    fill="url(#reportQuestionedCost)"
                    name="Estimated questioned cost"
                    stroke="#005ea8"
                    strokeWidth={3}
                    type="monotone"
                  />
                </AreaChart>
              )}
            </MeasuredChartFrame>
            <figcaption>Trend uses service dates from filtered synthetic claim records.</figcaption>
          </figure>

          <figure className="chart-panel">
            <div className="chart-panel__header">
              <div>
                <p className="page-eyebrow">Workflow mix</p>
                <h2>Case Status Distribution</h2>
              </div>
            </div>
            <MeasuredChartFrame
              className="chart-frame--donut"
              fallback="Case status distribution loading."
              label="Donut chart of case status distribution"
            >
              {({ width, height }) => (
                <PieChart height={height} width={width}>
                  <Tooltip formatter={chartNumberFormatter} />
                  <Pie
                    cx="50%"
                    cy="50%"
                    data={statusMix}
                    dataKey="value"
                    innerRadius="58%"
                    nameKey="name"
                    outerRadius="84%"
                    paddingAngle={2}
                  >
                    {statusMix.map((entry) => (
                      <Cell fill={entry.fill} key={entry.name} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" />
                </PieChart>
              )}
            </MeasuredChartFrame>
            <figcaption>Status distribution reflects active, non-deleted case files.</figcaption>
          </figure>
        </section>
      )}

      {(kind === "command-center" || kind === "provider-risk") && (
        <section className="report-visual-grid print-report-section" aria-labelledby="provider-visual-heading">
          <figure className="chart-panel chart-panel--wide">
            <div className="chart-panel__header">
              <div>
                <p className="page-eyebrow">Provider concentration</p>
                <h2 id="provider-visual-heading">Estimated Questioned Cost by Provider</h2>
              </div>
              <UsaButton href="/risk-queue" variant="outline">
                Open risk queue
              </UsaButton>
            </div>
            <MeasuredChartFrame fallback="Provider chart loading." label="Horizontal bar chart of provider estimated questioned cost">
              {({ width, height }) => (
                <BarChart
                  data={providerChart}
                  height={height}
                  layout="vertical"
                  margin={{ top: 4, right: 30, left: 42, bottom: 4 }}
                  width={width}
                >
                  <CartesianGrid stroke="#dfe1e2" strokeDasharray="4 4" horizontal={false} />
                  <XAxis tickFormatter={chartCompactCurrencyFormatter} type="number" />
                  <YAxis dataKey="shortName" tickLine={false} type="category" width={120} />
                  <Tooltip formatter={chartCurrencyFormatter} />
                  <Bar dataKey="estimatedQuestionedCost" fill="#2e8540" name="Estimated questioned cost" radius={[0, 6, 6, 0]} />
                </BarChart>
              )}
            </MeasuredChartFrame>
            <figcaption>Provider bars are sorted by estimated questioned cost under the active filters.</figcaption>
          </figure>
        </section>
      )}

      {(kind === "command-center" || kind === "case-aging") && (
        <section className="report-visual-grid print-report-section" aria-labelledby="aging-visual-heading">
          <figure className="chart-panel chart-panel--wide">
            <div className="chart-panel__header">
              <div>
                <p className="page-eyebrow">Aging pressure</p>
                <h2 id="aging-visual-heading">Case Aging by Workflow Status</h2>
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
                  <Bar dataKey="31-60 days" fill="#ffbe2e" stackId="age" />
                  <Bar dataKey="61+ days" fill="#b50909" stackId="age" />
                </BarChart>
              )}
            </MeasuredChartFrame>
            <figcaption>Age buckets are calculated from case creation date to closure or current date.</figcaption>
          </figure>
        </section>
      )}

      <section className="report-table-panel print-report-section" aria-labelledby="report-table-heading">
        <h2 id="report-table-heading">Report Detail Table</h2>
        {kind === "questioned-cost" ? (
          <UsaTable
            caption="Questioned cost trend report details"
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
        ) : kind === "case-aging" ? (
          <UsaTable
            caption="Case aging report details"
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
        ) : (
          <>
            <UsaTable
              caption="Provider risk report details"
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
              rows={providerRiskPage.items}
              getRowKey={(row) => String(row.providerId)}
            />
            <UsaPagination
              ariaLabel="Report detail table pagination"
              page={providerRiskPage.page}
              pageSize={providerRiskPage.pageSize}
              pageSizeOptions={providerRiskDetailPageSizeOptions}
              totalItems={providerRiskPage.totalItems}
              totalPages={providerRiskPage.totalPages}
              getPageHref={(page) => createReportHref({ ...filters, page })}
              onPageSizeChange={(pageSize) => router.push(createReportHref({ ...filters, page: 1, pageSize }))}
            />
          </>
        )}
      </section>
    </div>
  );
}
