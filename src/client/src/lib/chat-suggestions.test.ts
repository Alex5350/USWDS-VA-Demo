import assert from "node:assert/strict";

import {
  caseAssistantSuggestionPrompts,
  getRandomCaseAssistantSuggestions
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

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}
