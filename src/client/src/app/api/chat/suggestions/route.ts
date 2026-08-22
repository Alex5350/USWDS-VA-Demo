import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getRandomCaseAssistantSuggestions,
  normalizeCaseAssistantSuggestions,
  type CaseAssistantSuggestion
} from "@/lib/chat-suggestions";

export const runtime = "nodejs";
export const maxDuration = 20;

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const fallbackDemoUserEmail = "demo.readonly@local";
const suggestionCount = 4;
const defaultModel = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.1-flash-lite-preview";

type SuggestionSource = "gemini" | "fallback";

type DotnetRequestInit = {
  method?: "GET" | "POST";
  body?: unknown;
};

type CaseCount = {
  group: string;
  count: number;
  estimatedQuestionedCost: number;
};

type ProviderRiskSummary = {
  providerName: string;
  providerType: string;
  state: string;
  claimCount: number;
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

type PagedResult<T> = {
  items: T[];
  totalItems: number;
};

type SuggestionDataset = {
  countsByStatus: CaseCount[];
  countsByRiskLevel: CaseCount[];
  countsByProviderType: CaseCount[];
  countsByAssignee: CaseCount[];
  aging: CaseAging[];
  providerRisk: ProviderRiskSummary[];
  highestRiskCases: RiskQueueItem[];
};

type SuggestionsResponse = {
  source: SuggestionSource;
  suggestions: CaseAssistantSuggestion[];
};

const suggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        label: z.string().min(3).max(48),
        prompt: z.string().min(20).max(280)
      })
    )
    .min(suggestionCount)
    .max(6)
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const demoUserEmail = getDemoUserEmail(request);
  const seed = getSuggestionSeed(url, demoUserEmail);

  try {
    const dataset = await loadSuggestionDataset(demoUserEmail);
    const generatedSuggestions = await generateGeminiSuggestions(dataset, seed);

    if (generatedSuggestions.length > 0) {
      return NextResponse.json({
        source: "gemini",
        suggestions: normalizeCaseAssistantSuggestions(generatedSuggestions, seed, suggestionCount)
      } satisfies SuggestionsResponse);
    }
  } catch {
    // Suggestion generation should not block analysts from asking case questions.
  }

  return NextResponse.json({
    source: "fallback",
    suggestions: getRandomCaseAssistantSuggestions(seed, suggestionCount)
  } satisfies SuggestionsResponse);
}

async function loadSuggestionDataset(demoUserEmail: string): Promise<SuggestionDataset> {
  const [countsByStatus, countsByRiskLevel, countsByProviderType, countsByAssignee, aging, providerRisk, riskQueue] =
    await Promise.all([
      getCaseCounts(demoUserEmail, "Status"),
      getCaseCounts(demoUserEmail, "RiskLevel"),
      getCaseCounts(demoUserEmail, "ProviderType"),
      getCaseCounts(demoUserEmail, "AssignedTo"),
      callDotnet<CaseAging[]>("/api/chat/tools/case-aging", demoUserEmail, {
        method: "POST",
        body: {}
      }),
      callDotnet<ProviderRiskSummary[]>("/api/chat/tools/provider-risk", demoUserEmail, {
        method: "POST",
        body: {}
      }),
      callDotnet<PagedResult<RiskQueueItem>>("/api/chat/tools/risk-queue-search", demoUserEmail, {
        method: "POST",
        body: {
          sortDirection: "riskScoreDesc",
          page: 1,
          pageSize: 5
        }
      })
    ]);

  return {
    countsByStatus,
    countsByRiskLevel,
    countsByProviderType,
    countsByAssignee,
    aging,
    providerRisk: providerRisk.slice(0, 8),
    highestRiskCases: riskQueue.items.slice(0, 5)
  };
}

async function getCaseCounts(demoUserEmail: string, groupBy: "Status" | "RiskLevel" | "ProviderType" | "AssignedTo") {
  return callDotnet<CaseCount[]>("/api/chat/tools/case-counts", demoUserEmail, {
    method: "POST",
    body: { groupBy }
  });
}

async function generateGeminiSuggestions(dataset: SuggestionDataset, seed: string) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return [];
  }

  const { output } = await generateText({
    model: google(defaultModel),
    output: Output.object({
      schema: suggestionSchema,
      name: "caseAssistantSuggestions",
      description: "Unique suggested questions grounded in the current synthetic case dataset."
    }),
    temperature: 0.9,
    maxOutputTokens: 900,
    system:
      "You write concise, useful prompt suggestions for a read-only government case-risk assistant. Use only the supplied synthetic dataset summary. Do not invent external facts. Do not ask for actions that would modify records.",
    prompt: createSuggestionPrompt(dataset, seed)
  });

  return output.suggestions;
}

function createSuggestionPrompt(dataset: SuggestionDataset, seed: string) {
  return [
    `Randomization seed: ${seed}`,
    "Generate 4 unique analyst questions for a VA OIG FWA case assistant.",
    "Each suggestion needs a short label and a single complete prompt.",
    "Vary the questions across status, risk level, provider type, assignee workload, aging, provider concentration, and highest-risk cases when the data supports it.",
    "Avoid repeating these fallback prompt phrasings verbatim: executive summary, open case distribution, provider type cost drivers, critical risk triage, top provider risk, aging profile, compare provider types, assignee workload, highest-risk new cases, supervisor briefing.",
    "",
    "Current synthetic dataset summary:",
    JSON.stringify(dataset, null, 2)
  ].join("\n");
}

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
    throw new Error(`Case assistant suggestion data request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function getDemoUserEmail(request: Request) {
  const headerValue = request.headers.get("X-Demo-User")?.trim();

  if (headerValue) {
    return headerValue;
  }

  const url = new URL(request.url);
  const queryValue = url.searchParams.get("demoUserEmail")?.trim();

  return queryValue || fallbackDemoUserEmail;
}

function getSuggestionSeed(url: URL, demoUserEmail: string) {
  const requestedSeed = url.searchParams.get("seed")?.trim();

  if (requestedSeed) {
    return `${demoUserEmail}:${requestedSeed}`;
  }

  return `${demoUserEmail}:${crypto.randomUUID()}`;
}
