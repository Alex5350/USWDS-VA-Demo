import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getChatSuggestionsPanelState } from "./chat-suggestions-panel";

const failures: string[] = [];
const stylesheet = readFileSync(new URL("../styles/globals.scss", import.meta.url), "utf8");

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
  assert.match(
    stylesheet,
    /\.chat-suggestions__grid\[hidden\]\s*\{[\s\S]*?display:\s*none;/,
    "Expected .chat-suggestions__grid[hidden] to force display: none."
  );
});

await runTest("defines suggestion colors that differ from chat message roles", () => {
  const suggestionPanel = getCssRule(".chat-suggestions");
  const suggestionItem = getCssRule(".chat-suggestions__item");
  const suggestionHover = getCssRule(".chat-suggestions__item:hover:not(:disabled)");
  const suggestionLabel = getCssRule(".chat-suggestions__label");

  assert.match(suggestionPanel, /background:\s*#fff8e8;/, "Expected the suggestion panel to use a gold-tinted surface.");
  assert.match(suggestionPanel, /border:\s*1px solid #e8c86f;/, "Expected the suggestion panel to use a gold border.");
  assert.match(suggestionItem, /background:\s*#fffdf7;/, "Expected suggestion cards to use a distinct warm surface.");
  assert.match(suggestionItem, /border-left:\s*0\.25rem solid #f9c642;/, "Expected suggestion cards to use a gold accent.");
  assert.match(suggestionHover, /background:\s*#fff3cd;/, "Expected suggestion hover state to stay in the gold family.");
  assert.match(suggestionLabel, /color:\s*#7d4e00;/, "Expected suggestion labels to use distinct amber text.");
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}

function getCssRule(selector: string) {
  const expression = new RegExp(`${escapeRegExp(selector)}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const match = stylesheet.match(expression);

  assert.ok(match, `Expected stylesheet to define ${selector}.`);

  return match[1];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
