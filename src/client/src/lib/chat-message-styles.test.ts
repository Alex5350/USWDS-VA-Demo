import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const stylesheet = readFileSync(new URL("../styles/globals.scss", import.meta.url), "utf8");

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("gives analyst and assistant messages distinct role panels", () => {
  const analystCard = getCssRule(".chat-message--user .chat-message__card");
  const assistantCard = getCssRule(".chat-message--assistant .chat-message__card");

  assert.match(analystCard, /background:\s*#f1f8f4;/, "Expected analyst messages to use a green-tinted panel.");
  assert.match(analystCard, /border-color:\s*#78b985;/, "Expected analyst messages to use a green border.");
  assert.match(analystCard, /border-right:\s*0\.3rem solid #2e7d32;/, "Expected analyst messages to use a right-side role accent.");

  assert.match(assistantCard, /#f7fbff/, "Expected assistant messages to use a blue-tinted panel.");
  assert.match(assistantCard, /border-color:\s*#6ea7d8;/, "Expected assistant messages to use a blue border.");
  assert.match(assistantCard, /border-left:\s*0\.3rem solid var\(--app-blue\);/, "Expected assistant messages to use a left-side role accent.");
});

await runTest("gives analyst and assistant headers distinct role labels", () => {
  const analystHeader = getCssRule(".chat-message--user .chat-message__header");
  const assistantHeader = getCssRule(".chat-message--assistant .chat-message__header");
  const analystLabel = getCssRule(".chat-message--user .chat-message__header h3");
  const assistantLabel = getCssRule(".chat-message--assistant .chat-message__header h3");

  assert.match(analystHeader, /background:\s*#dff2e5;/, "Expected analyst message headers to use a green tint.");
  assert.match(assistantHeader, /background:\s*#e8f2fb;/, "Expected assistant message headers to use a blue tint.");
  assert.match(analystLabel, /color:\s*#245f2d;/, "Expected analyst labels to use green text.");
  assert.match(assistantLabel, /color:\s*var\(--app-blue-dark\);/, "Expected assistant labels to use blue text.");
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
