import assert from "node:assert/strict";

import {
  caseAssistantSuggestionPrompts,
  getRandomCaseAssistantSuggestions,
  normalizeCaseAssistantSuggestions
} from "./chat-suggestions";

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("returns deterministic nonduplicated suggestions for a seed", () => {
  const first = getRandomCaseAssistantSuggestions("demo-user:chat-1", 4);
  const second = getRandomCaseAssistantSuggestions("demo-user:chat-1", 4);

  assert.deepEqual(first, second);
  assert.equal(first.length, 4);
  assert.equal(new Set(first.map((suggestion) => suggestion.prompt)).size, 4);
});

await runTest("caps suggestions at the available prompt count", () => {
  const suggestions = getRandomCaseAssistantSuggestions("demo-user:chat-1", 999);

  assert.equal(suggestions.length, caseAssistantSuggestionPrompts.length);
});

await runTest("exposes operational dataset prompts", () => {
  assert.ok(caseAssistantSuggestionPrompts.length >= 10);
  assert.ok(
    caseAssistantSuggestionPrompts.some((suggestion) =>
      suggestion.prompt.includes("grouped by status, risk level, and estimated questioned cost")
    )
  );
  assert.ok(
    caseAssistantSuggestionPrompts.every((suggestion) => suggestion.label.trim() && suggestion.prompt.trim())
  );
});

await runTest("normalizes generated suggestions and fills missing slots from fallbacks", () => {
  const suggestions = normalizeCaseAssistantSuggestions(
    [
      {
        label:
          "  Provider risk concentration with a deliberately overlong label that should be shortened before rendering  ",
        prompt:
          "  Which provider types are driving the largest estimated questioned cost in the current synthetic case inventory?  "
      },
      {
        label: "Duplicate provider risk",
        prompt:
          "Which provider types are driving the largest estimated questioned cost in the current synthetic case inventory?"
      },
      {
        label: "",
        prompt: "Too short"
      }
    ],
    "demo-user:new-chat",
    4
  );

  assert.equal(suggestions.length, 4);
  assert.equal(new Set(suggestions.map((suggestion) => suggestion.prompt.toLowerCase())).size, 4);
  assert.ok(suggestions.every((suggestion) => suggestion.label.length <= 48));
  assert.ok(suggestions.every((suggestion) => suggestion.prompt.length <= 280));
  assert.ok(
    suggestions.some((suggestion) =>
      caseAssistantSuggestionPrompts.some((fallback) => fallback.prompt === suggestion.prompt)
    )
  );
});

await runTest("fetches generated suggestions from the Next chat suggestions route", async () => {
  let observedInput: RequestInfo | URL | undefined;
  let observedHeaders: Headers | undefined;

  await withFetchStub(
    (input, init) => {
      observedInput = input;
      observedHeaders = new Headers(init?.headers);
      return Response.json({
        source: "gemini",
        suggestions: [
          {
            label: "Dental cost clusters",
            prompt: "Which dental providers combine the highest critical-risk case counts with estimated questioned cost?"
          },
          {
            label: "Older under review cases",
            prompt: "Which UnderReview cases older than 31 days account for the most estimated questioned cost?"
          },
          {
            label: "Assignee risk mix",
            prompt: "Which assignees have the most high-risk and critical-risk records in their current queue?"
          },
          {
            label: "Procedure risk flags",
            prompt: "Which procedure codes appear most often in the highest-risk New cases and what risk flags recur?"
          }
        ]
      });
    },
    async () => {
      const { getGeneratedCaseAssistantSuggestions } = await import("./chat-suggestions");
      const suggestions = await getGeneratedCaseAssistantSuggestions({
        demoUserEmail: "demo.readonly@local",
        seed: "fresh-new-chat"
      });

      assert.equal(suggestions.length, 4);
      assert.equal(suggestions[0]?.label, "Dental cost clusters");
    }
  );

  assert.equal(String(observedInput), "/api/chat/suggestions?seed=fresh-new-chat");
  assert.equal(observedHeaders?.get("X-Demo-User"), "demo.readonly@local");
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}

async function withFetchStub(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>,
  run: () => Promise<void>
) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}
