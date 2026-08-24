import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getChatSuggestionsPanelState } from "./chat-suggestions-panel";

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("returns expanded panel state with a hide action", () => {
  assert.deepEqual(getChatSuggestionsPanelState({ isCollapsed: false, suggestionCount: 4 }), {
    isVisible: true,
    toggleLabel: "Hide suggestions",
    statusText: "Grounded in the synthetic case dataset.",
    ariaExpanded: true
  });
});

await runTest("returns collapsed panel state with a show action and count", () => {
  assert.deepEqual(getChatSuggestionsPanelState({ isCollapsed: true, suggestionCount: 4 }), {
    isVisible: false,
    toggleLabel: "Show suggestions",
    statusText: "4 suggestions available.",
    ariaExpanded: false
  });
});

await runTest("returns null for an empty suggestion set", () => {
  assert.equal(getChatSuggestionsPanelState({ isCollapsed: false, suggestionCount: 0 }), null);
});

await runTest("defines CSS that hides the suggestion grid when collapsed", () => {
  const stylesheet = readFileSync(new URL("../styles/globals.scss", import.meta.url), "utf8");

  assert.match(
    stylesheet,
    /\.chat-suggestions__grid\[hidden\]\s*\{[\s\S]*?display:\s*none;/,
    "Expected .chat-suggestions__grid[hidden] to force display: none."
  );
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}
