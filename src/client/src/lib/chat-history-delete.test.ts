import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getChatDeleteDialogState } from "./chat-history-delete";

const failures: string[] = [];
const stylesheet = readFileSync(new URL("../styles/globals.scss", import.meta.url), "utf8");

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("returns null when no chat is pending deletion", () => {
  assert.equal(getChatDeleteDialogState({ pendingTitle: null, isDeleting: false }), null);
});

await runTest("returns confirmation copy for a selected chat", () => {
  assert.deepEqual(getChatDeleteDialogState({ pendingTitle: "Open cases", isDeleting: false }), {
    heading: 'Delete "Open cases"?',
    body: "This permanently deletes the saved conversation, messages, tool activity, and pinned context. This cannot be undone.",
    confirmLabel: "Delete conversation",
    cancelLabel: "Cancel",
    controlsDisabled: false
  });
});

await runTest("disables dialog actions while deletion is in progress", () => {
  assert.deepEqual(getChatDeleteDialogState({ pendingTitle: " ", isDeleting: true }), {
    heading: 'Delete "New chat"?',
    body: "This permanently deletes the saved conversation, messages, tool activity, and pinned context. This cannot be undone.",
    confirmLabel: "Deleting...",
    cancelLabel: "Cancel",
    controlsDisabled: true
  });
});

await runTest("keeps chat history row actions horizontally aligned", () => {
  const actionsRule = getCssRule(".action-row.chat-history-table__actions");
  const openLinkRule = getCssRule(".chat-history-table__open-link");
  const deleteButtonRule = getCssRule(".chat-history-table__delete-button");

  assert.match(actionsRule, /flex-wrap:\s*nowrap;/, "Expected Open and Delete actions to stay in one horizontal row.");
  assert.match(actionsRule, /gap:\s*0\.5rem;/, "Expected a compact horizontal gap between row actions.");
  assert.match(openLinkRule, /white-space:\s*nowrap;/, "Expected Open action text not to wrap.");
  assert.match(deleteButtonRule, /white-space:\s*nowrap;/, "Expected Delete action text not to wrap.");
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
