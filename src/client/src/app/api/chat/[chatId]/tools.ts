import { tool } from "ai";
import { z } from "zod";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export type ToolContext = {
  chatId: string;
  demoUserEmail: string;
};

type DotnetRequestInit = {
  method?: "GET" | "POST";
  body?: unknown;
};

type ToolLogPayload = {
  toolName: string;
  allowedSurface: string;
  argumentsJson: string;
  resultSummary: string | null;
  rowCount: number | null;
  durationMs: number;
  succeeded: boolean;
  errorMessage: string | null;
};

type CaseCount = {
  group: string;
  count: number;
  estimatedQuestionedCost: number;
};

type CaseInsightSummary = {
  caseId: number;
  claimId: number;
  providerName: string;
  providerType: string;
  state: string;
  status: string;
  priority: string;
  riskScore: number;
  riskLevel: string;
  paidAmount: number;
  estimatedQuestionedCost: number;
  serviceDate: string;
  riskFindingCount: number;
  noteCount: number;
  riskIndicators: string[];
  disclaimer: string;
};

type RiskQueueItem = {
  caseId: number;
  claimId: number;
  providerName: string;
  procedureCode: string;
  serviceDate: string;
  paidAmount: number;
  riskScore: number;
  riskLevel: string;
  riskFlags: string[];
  estimatedQuestionedCost: number;
  status: string;
};

type ProviderRiskSummary = {
  providerId: number;
  providerName: string;
  providerType: string;
  state: string;
  claimCount: number;
  totalPaidAmount: number;
  highRiskClaimCount: number;
  criticalRiskClaimCount: number;
  estimatedQuestionedCost: number;
  averageRiskScore: number;
};

type CaseAging = {
  status: string;
  days0To15: number;
  days16To30: number;
  days31To60: number;
  days61Plus: number;
};

type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const optionalText = z.preprocess(
  (value) => (value === null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().trim().optional()
);

const optionalDate = z.preprocess(
  (value) => (value === null || (typeof value === "string" && value.trim() === "") ? undefined : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use ISO date format YYYY-MM-DD.").optional()
);

const optionalPositiveInt = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.number().int().positive().optional()
);

const reportFilterSchema = z.object({
  fromDate: optionalDate.describe("Optional inclusive service date lower bound as YYYY-MM-DD."),
  toDate: optionalDate.describe("Optional inclusive service date upper bound as YYYY-MM-DD."),
  status: optionalText.describe("Optional case status filter, or omit for all statuses."),
  riskLevel: optionalText.describe("Optional risk level filter, or omit for all risk levels."),
  providerId: optionalPositiveInt.describe("Optional provider ID filter."),
  providerType: optionalText.describe("Optional provider type filter."),
  state: optionalText.describe("Optional provider state filter."),
  search: optionalText.describe("Optional provider-name search text.")
});

const caseCountSchema = reportFilterSchema.extend({
  groupBy: z
    .enum(["Status", "RiskLevel", "Priority", "ProviderType", "AssignedTo"])
    .default("Status")
    .describe("Dimension to group active case counts by.")
});

const riskQueueSearchSchema = z.object({
  riskLevel: optionalText.describe("Optional risk level filter, or omit for all risk levels."),
  status: optionalText.describe("Optional case status filter, or omit for all statuses."),
  fromDate: optionalDate.describe("Optional inclusive service date lower bound as YYYY-MM-DD."),
  toDate: optionalDate.describe("Optional inclusive service date upper bound as YYYY-MM-DD."),
  providerType: optionalText.describe("Optional provider type filter."),
  search: optionalText.describe("Optional provider-name search text."),
  sortDirection: z.enum(["riskScoreDesc", "riskScoreAsc"]).default("riskScoreDesc"),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(25).default(10)
});

async function callDotnet<T>(path: string, demoUserEmail: string, init: DotnetRequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: init.method ?? "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Demo-User": demoUserEmail
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body)
  });

  if (!response.ok) {
    throw await createDotnetError(response, path);
  }

  return (await response.json()) as T;
}

async function logToolCall(context: ToolContext, payload: ToolLogPayload) {
  await callDotnet(`/api/chat/sessions/${encodeURIComponent(context.chatId)}/tool-calls`, context.demoUserEmail, {
    method: "POST",
    body: {
      messageId: null,
      ...payload
    }
  });
}

async function runLoggedTool<TResult>(
  context: ToolContext,
  options: {
    toolName: string;
    allowedSurface: string;
    input: unknown;
    run: () => Promise<TResult>;
    summarize: (result: TResult) => string;
    rowCount: (result: TResult) => number | null;
  }
): Promise<TResult> {
  const startedAt = Date.now();
  const argumentsJson = JSON.stringify(options.input);

  try {
    const result = await options.run();
    await logToolCall(context, {
      toolName: options.toolName,
      allowedSurface: options.allowedSurface,
      argumentsJson,
      resultSummary: options.summarize(result),
      rowCount: options.rowCount(result),
      durationMs: Date.now() - startedAt,
      succeeded: true,
      errorMessage: null
    });
    return result;
  } catch (error) {
    await tryLogToolFailure(context, {
      toolName: options.toolName,
      allowedSurface: options.allowedSurface,
      argumentsJson,
      durationMs: Date.now() - startedAt,
      errorMessage: getErrorMessage(error)
    });
    throw error;
  }
}

async function tryLogToolFailure(
  context: ToolContext,
  payload: Pick<ToolLogPayload, "toolName" | "allowedSurface" | "argumentsJson" | "durationMs" | "errorMessage">
) {
  try {
    await logToolCall(context, {
      ...payload,
      resultSummary: null,
      rowCount: null,
      succeeded: false
    });
  } catch {
    // Preserve the original tool failure for the model and route response.
  }
}

async function createDotnetError(response: Response, path: string) {
  const statusText = response.statusText ? ` ${response.statusText}` : "";
  const detail = await readErrorDetail(response);
  const suffix = detail ? `: ${detail}` : "";
  return new Error(`Case assistant request to ${path} failed with ${response.status}${statusText}${suffix}`);
}

async function readErrorDetail(response: Response) {
  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";
  const text = await response.text();
  const trimmed = text.trim();

  if (!trimmed || trimmed.length > 500) {
    return "";
  }

  if (contentType.includes("json")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;
        const detail = record.detail ?? record.title ?? record.message;
        return typeof detail === "string" ? detail : "";
      }
    } catch {
      return "";
    }
  }

  return /[<>{}\r\n]/.test(trimmed) ? "" : trimmed;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown case assistant tool error.";
}

function summarizeCaseCounts(rows: CaseCount[]) {
  const totalCases = rows.reduce((total, row) => total + row.count, 0);
  return `Returned ${rows.length} grouped case-count rows covering ${totalCases} cases.`;
}

function summarizeCaseSummary(summary: CaseInsightSummary) {
  return `Returned summary for case ${summary.caseId}: ${summary.providerName}, ${summary.status}, ${summary.riskLevel} risk.`;
}

function summarizeRiskQueue(result: PagedResult<RiskQueueItem>) {
  return `Returned ${result.items.length} of ${result.totalItems} risk queue rows.`;
}

function summarizeProviderRisk(rows: ProviderRiskSummary[]) {
  return `Returned ${rows.length} provider risk rows.`;
}

function summarizeCaseAging(rows: CaseAging[]) {
  return `Returned case aging buckets for ${rows.length} statuses.`;
}

export function createCaseTools(context: ToolContext) {
  return {
    getCaseCounts: tool({
      description:
        "Read-only tool. Count active synthetic case records by status, risk level, priority, provider type, or assignee.",
      inputSchema: caseCountSchema,
      execute: async (input) =>
        runLoggedTool(context, {
          toolName: "getCaseCounts",
          allowedSurface: "CaseFiles",
          input,
          run: () =>
            callDotnet<CaseCount[]>("/api/chat/tools/case-counts", context.demoUserEmail, {
              method: "POST",
              body: input
            }),
          summarize: summarizeCaseCounts,
          rowCount: (result) => result.length
        })
    }),
    getCaseSummary: tool({
      description:
        "Read-only tool. Get a compact summary of one active synthetic case record by numeric case ID.",
      inputSchema: z.object({
        caseId: z.number().int().positive().describe("Numeric case ID to summarize.")
      }),
      execute: async (input) =>
        runLoggedTool(context, {
          toolName: "getCaseSummary",
          allowedSurface: "CaseFiles",
          input,
          run: () =>
            callDotnet<CaseInsightSummary>(
              `/api/chat/tools/cases/${encodeURIComponent(input.caseId)}/summary`,
              context.demoUserEmail
            ),
          summarize: summarizeCaseSummary,
          rowCount: () => 1
        })
    }),
    searchRiskQueue: tool({
      description:
        "Read-only tool. Search active synthetic risk queue cases with bounded pagination and risk-score sorting.",
      inputSchema: riskQueueSearchSchema,
      execute: async (input) =>
        runLoggedTool(context, {
          toolName: "searchRiskQueue",
          allowedSurface: "RiskQueue",
          input,
          run: () =>
            callDotnet<PagedResult<RiskQueueItem>>("/api/chat/tools/risk-queue-search", context.demoUserEmail, {
              method: "POST",
              body: input
            }),
          summarize: summarizeRiskQueue,
          rowCount: (result) => result.items.length
        })
    }),
    getProviderRisk: tool({
      description:
        "Read-only tool. Get provider-level synthetic claim volume, risk counts, and estimated questioned cost.",
      inputSchema: reportFilterSchema,
      execute: async (input) =>
        runLoggedTool(context, {
          toolName: "getProviderRisk",
          allowedSurface: "Reports",
          input,
          run: () =>
            callDotnet<ProviderRiskSummary[]>("/api/chat/tools/provider-risk", context.demoUserEmail, {
              method: "POST",
              body: input
            }),
          summarize: summarizeProviderRisk,
          rowCount: (result) => result.length
        })
    }),
    getCaseAging: tool({
      description: "Read-only tool. Get synthetic case aging buckets grouped by case status.",
      inputSchema: reportFilterSchema,
      execute: async (input) =>
        runLoggedTool(context, {
          toolName: "getCaseAging",
          allowedSurface: "Reports",
          input,
          run: () =>
            callDotnet<CaseAging[]>("/api/chat/tools/case-aging", context.demoUserEmail, {
              method: "POST",
              body: input
            }),
          summarize: summarizeCaseAging,
          rowCount: (result) => result.length
        })
    })
  };
}
