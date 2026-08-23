"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { RiskLevelTag } from "@/components/layout/RiskLevelTag";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaFormGroup } from "@/components/uswds/UsaFormGroup";
import { UsaPagination } from "@/components/uswds/UsaPagination";
import { UsaTag } from "@/components/uswds/UsaTag";
import { type PaginatedResponse, type RiskQueueFilters, type RiskQueueItem, getRiskQueue } from "@/lib/api-client";
import { listToSentence } from "@/lib/accessibility";
import { formatDate, numberFormatter, preciseCurrencyFormatter } from "@/lib/formatters";

const emptyQueue: PaginatedResponse<RiskQueueItem> = {
  items: [],
  totalItems: 0,
  page: 1,
  pageSize: 5,
  totalPages: 1
};

const defaultRiskQueueFilters: Required<Pick<RiskQueueFilters, "riskLevel" | "status" | "fromDate" | "toDate" | "providerType" | "search" | "page" | "pageSize">> = {
  riskLevel: "All",
  status: "All",
  fromDate: "2026-01-01",
  toDate: "2026-05-31",
  providerType: "All",
  search: "",
  page: 1,
  pageSize: 5
};

const pageSizeOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

type QueryReader = {
  get(name: string): string | null;
};

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function sortDirectionFromQuery(searchParams: QueryReader) {
  return searchParams.get("sortDirection") === "riskScoreAsc" ? "riskScoreAsc" : "riskScoreDesc";
}

function filtersFromQuery(searchParams: QueryReader): RiskQueueFilters {
  return {
    riskLevel: searchParams.get("riskLevel") ?? defaultRiskQueueFilters.riskLevel,
    status: searchParams.get("status") ?? defaultRiskQueueFilters.status,
    fromDate: searchParams.get("fromDate") ?? defaultRiskQueueFilters.fromDate,
    toDate: searchParams.get("toDate") ?? defaultRiskQueueFilters.toDate,
    providerType: searchParams.get("providerType") ?? defaultRiskQueueFilters.providerType,
    search: searchParams.get("search") ?? defaultRiskQueueFilters.search,
    sortDirection: sortDirectionFromQuery(searchParams),
    page: parsePositiveInt(searchParams.get("page"), defaultRiskQueueFilters.page),
    pageSize: parsePositiveInt(searchParams.get("pageSize"), defaultRiskQueueFilters.pageSize)
  };
}

function statusTone(status: string) {
  if (status === "New") {
    return "blue";
  }

  if (status === "UnderReview") {
    return "gold";
  }

  if (status === "Referred" || status === "Escalated") {
    return "green";
  }

  return "default";
}

export function RiskQueueView() {
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromQuery(searchParams), [searchParams]);
  const initialSortDirection = sortDirectionFromQuery(searchParams);

  return (
    <RiskQueueContent
      key={searchParams.toString()}
      filters={filters}
      initialSortDirection={initialSortDirection}
    />
  );
}

type RiskQueueContentProps = {
  filters: RiskQueueFilters;
  initialSortDirection: string;
};

function RiskQueueContent({ filters, initialSortDirection }: RiskQueueContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [draftFilters, setDraftFilters] = useState<RiskQueueFilters>(filters);
  const [sortDirection, setSortDirection] = useState(initialSortDirection);
  const [queue, setQueue] = useState<PaginatedResponse<RiskQueueItem>>(emptyQueue);
  const [statusMessage, setStatusMessage] = useState("Loading risk queue.");

  function createQueueHref(nextFilters: RiskQueueFilters, nextSortDirection = sortDirection) {
    const params = new URLSearchParams();
    const page = nextFilters.page ?? defaultRiskQueueFilters.page;
    const pageSize = nextFilters.pageSize ?? defaultRiskQueueFilters.pageSize;

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    ([
      ["riskLevel", nextFilters.riskLevel, defaultRiskQueueFilters.riskLevel],
      ["status", nextFilters.status, defaultRiskQueueFilters.status],
      ["fromDate", nextFilters.fromDate, defaultRiskQueueFilters.fromDate],
      ["toDate", nextFilters.toDate, defaultRiskQueueFilters.toDate],
      ["providerType", nextFilters.providerType, defaultRiskQueueFilters.providerType],
      ["search", nextFilters.search, defaultRiskQueueFilters.search]
    ] as const).forEach(([key, value, defaultValue]) => {
      if (value && value !== defaultValue) {
        params.set(key, value);
      }
    });

    if (nextSortDirection !== "riskScoreDesc") {
      params.set("sortDirection", nextSortDirection);
    }

    return `${pathname}?${params.toString()}`;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadQueue() {
      setStatusMessage("Loading risk queue.");
      const result = await getRiskQueue(filters);

      if (isMounted) {
        setQueue(result);
        setStatusMessage(`${numberFormatter.format(result.totalItems)} review candidates loaded.`);
      }
    }

    void loadQueue();

    return () => {
      isMounted = false;
    };
  }, [filters]);

  function updateDraftFilter(key: keyof RiskQueueFilters, value: string) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(createQueueHref({ ...draftFilters, page: 1, pageSize: filters.pageSize ?? 5 }));
  }

  return (
    <div className="page-stack">
      <form className="data-toolbar risk-filter-panel" onSubmit={handleSubmit}>
        <fieldset className="usa-fieldset">
          <legend className="usa-legend">Filter review candidates</legend>
          <p className="filter-panel-intro">
            Refine the triage queue by risk, workflow status, provider attributes, date range, and search terms.
          </p>

          <div className="risk-filter-primary" aria-label="Primary risk queue filters">
            <UsaFormGroup id="riskLevel" label="Risk level">
              <select
                className="usa-select"
                id="riskLevel"
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

            <UsaFormGroup id="status" label="Case status">
              <select
                className="usa-select"
                id="status"
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

            <UsaFormGroup id="providerType" label="Provider type">
              <select
                className="usa-select"
                id="providerType"
                name="providerType"
                value={draftFilters.providerType}
                onChange={(event) => updateDraftFilter("providerType", event.target.value)}
              >
                <option>All</option>
                <option>Dental</option>
                <option>Imaging</option>
                <option>Physical Therapy</option>
                <option>Home Health</option>
                <option>Durable Medical Equipment</option>
              </select>
            </UsaFormGroup>

            <UsaFormGroup id="fromDate" label="From date">
              <input
                className="usa-input"
                id="fromDate"
                name="fromDate"
                type="date"
                value={draftFilters.fromDate}
                onChange={(event) => updateDraftFilter("fromDate", event.target.value)}
              />
            </UsaFormGroup>

            <UsaFormGroup id="toDate" label="To date">
              <input
                className="usa-input"
                id="toDate"
                name="toDate"
                type="date"
                value={draftFilters.toDate}
                onChange={(event) => updateDraftFilter("toDate", event.target.value)}
              />
            </UsaFormGroup>
          </div>

          <UsaFormGroup className="filter-field--provider-search" id="search" label="Provider search">
            <input
              className="usa-input"
              id="search"
              name="search"
              type="search"
              value={draftFilters.search}
              onChange={(event) => updateDraftFilter("search", event.target.value)}
            />
          </UsaFormGroup>

          <div className="filter-actions" aria-label="Filter actions">
            <UsaButton type="submit">Apply filters</UsaButton>
            <UsaButton
              type="button"
              variant="outline"
              onClick={() => {
                const reset = {
                  riskLevel: "All",
                  status: "All",
                  fromDate: "2026-01-01",
                  toDate: "2026-05-31",
                  providerType: "All",
                  search: "",
                  page: 1,
                  pageSize: 5
                };
                setDraftFilters(reset);
                router.push(createQueueHref(reset, "riskScoreDesc"));
              }}
            >
              Reset
            </UsaButton>
          </div>
        </fieldset>
      </form>

      <div className="queue-results-toolbar">
        <p className="status-text" aria-live="polite">
          {statusMessage}
        </p>

        <UsaFormGroup className="queue-sort-control" id="sort" label="Sort by risk score">
          <select
            className="usa-select"
            id="sort"
            name="sort"
            value={sortDirection}
            onChange={(event) => {
              const nextSortDirection = event.target.value;
              setSortDirection(nextSortDirection);
              router.push(createQueueHref({ ...filters, page: 1 }, nextSortDirection));
            }}
          >
            <option value="riskScoreDesc">Highest first</option>
            <option value="riskScoreAsc">Lowest first</option>
          </select>
        </UsaFormGroup>
      </div>

      <div className="table-scroll">
        <table className="usa-table usa-table--striped">
          <caption>Risk-scored Community Care review candidates</caption>
          <thead>
            <tr>
              <th scope="col">Case</th>
              <th scope="col">Provider</th>
              <th scope="col">Service</th>
              <th scope="col">Paid</th>
              <th scope="col">Risk</th>
              <th scope="col">Indicators</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {queue.items.map((item) => (
              <tr key={item.caseId}>
                <th scope="row">
                  <Link href={`/cases/${item.caseId}`}>Case {item.caseId}</Link>
                  <div className="status-text">Claim {item.claimId}</div>
                </th>
                <td>
                  <strong>{item.providerName}</strong>
                  <div className="status-text">{item.providerType}</div>
                </td>
                <td>
                  {item.procedureCode}
                  <div className="status-text">{formatDate(item.serviceDate)}</div>
                </td>
                <td>
                  {preciseCurrencyFormatter.format(item.paidAmount)}
                  <div className="status-text">
                    Questioned: {preciseCurrencyFormatter.format(item.estimatedQuestionedCost)}
                  </div>
                </td>
                <td>
                  <RiskLevelTag level={item.riskLevel} />
                  <div className="status-text">Score {item.riskScore}</div>
                </td>
                <td>{listToSentence(item.riskFlags)}</td>
                <td>
                  <UsaTag tone={statusTone(item.status)}>{item.status}</UsaTag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UsaPagination
        ariaLabel="Risk queue pagination"
        page={queue.page}
        pageSize={filters.pageSize ?? defaultRiskQueueFilters.pageSize}
        pageSizeOptions={pageSizeOptions}
        totalItems={queue.totalItems}
        totalPages={queue.totalPages}
        getPageHref={(page) => createQueueHref({ ...filters, page })}
        onPageSizeChange={(pageSize) => router.push(createQueueHref({ ...filters, page: 1, pageSize }))}
      />
    </div>
  );
}
