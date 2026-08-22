import assert from "node:assert/strict";

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>;

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const originalGoogleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

process.env.NEXT_PUBLIC_API_BASE_URL = "http://dotnet.test";
delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const { GET } = await import("./route");

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function withFetchStub(handler: FetchHandler, run: () => Promise<void>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

await runTest("samples read-only case data before returning suggestions", async () => {
  const calls: FetchCall[] = [];

  await withFetchStub(
    async (input, init) => {
      calls.push({ input, init });
      const url = new URL(String(input));
      const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};

      if (url.pathname.endsWith("/api/chat/tools/case-counts")) {
        return Response.json(caseCountsFor(String(body.groupBy)));
      }

      if (url.pathname.endsWith("/api/chat/tools/provider-risk")) {
        return Response.json([
          {
            providerId: 17,
            providerName: "River Valley Dental",
            providerType: "Dental",
            state: "TX",
            claimCount: 12,
            totalPaidAmount: 143200,
            highRiskClaimCount: 8,
            criticalRiskClaimCount: 3,
            estimatedQuestionedCost: 51200,
            averageRiskScore: 84
          }
        ]);
      }

      if (url.pathname.endsWith("/api/chat/tools/case-aging")) {
        return Response.json([
          {
            status: "UnderReview",
            days0To15: 4,
            days16To30: 6,
            days31To60: 9,
            days61Plus: 3
          }
        ]);
      }

      if (url.pathname.endsWith("/api/chat/tools/risk-queue-search")) {
        return Response.json({
          items: [
            {
              caseId: 101,
              claimId: 9001,
              providerName: "River Valley Dental",
              procedureCode: "D7210",
              serviceDate: "2026-05-11",
              paidAmount: 1800,
              riskScore: 95,
              riskLevel: "Critical",
              riskFlags: ["Duplicate billing", "High utilization"],
              estimatedQuestionedCost: 1200,
              status: "New"
            }
          ],
          page: 1,
          pageSize: 5,
          totalItems: 1,
          totalPages: 1
        });
      }

      return new Response("Not found", { status: 404 });
    },
    async () => {
      const response = await GET(
        new Request("http://localhost/api/chat/suggestions?seed=fresh-new-chat", {
          headers: {
            "X-Demo-User": "demo.readonly@local"
          }
        })
      );

      assert.equal(response.status, 200);

      const body = (await response.json()) as {
        source?: string;
        suggestions?: Array<{ label: string; prompt: string }>;
      };

      assert.equal(body.source, "fallback");
      assert.equal(body.suggestions?.length, 4);
      assert.equal(new Set(body.suggestions?.map((suggestion) => suggestion.prompt)).size, 4);
    }
  );

  assert.ok(calls.length >= 5);
  assert.ok(calls.some((call) => String(call.init?.body).includes('"groupBy":"Status"')));
  assert.ok(calls.some((call) => String(call.init?.body).includes('"groupBy":"ProviderType"')));
  assert.ok(calls.some((call) => String(call.input).endsWith("/api/chat/tools/provider-risk")));
  assert.ok(calls.some((call) => String(call.input).endsWith("/api/chat/tools/case-aging")));
  assert.ok(calls.every((call) => new Headers(call.init?.headers).get("X-Demo-User") === "demo.readonly@local"));
});

restoreEnv("NEXT_PUBLIC_API_BASE_URL", originalApiBaseUrl);
restoreEnv("GOOGLE_GENERATIVE_AI_API_KEY", originalGoogleApiKey);

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}

function caseCountsFor(groupBy: string) {
  if (groupBy === "Status") {
    return [
      { group: "New", count: 47, estimatedQuestionedCost: 108423 },
      { group: "UnderReview", count: 26, estimatedQuestionedCost: 65847 }
    ];
  }

  if (groupBy === "ProviderType") {
    return [
      { group: "Dental", count: 22, estimatedQuestionedCost: 61200 },
      { group: "Imaging", count: 18, estimatedQuestionedCost: 44300 }
    ];
  }

  return [
    { group: "High", count: 86, estimatedQuestionedCost: 194380 },
    { group: "Critical", count: 13, estimatedQuestionedCost: 35352 }
  ];
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
