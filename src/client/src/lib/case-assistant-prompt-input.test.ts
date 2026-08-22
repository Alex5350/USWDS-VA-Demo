import assert from "node:assert/strict";

import {
  createCaseAssistantPromptMessage,
  getPromptInputActionState,
  shouldSubmitPromptInputKey
} from "./case-assistant-prompt-input";

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("creates a trimmed PromptInput-style message", () => {
  assert.deepEqual(createCaseAssistantPromptMessage("  Count high-risk cases.  "), {
    text: "Count high-risk cases."
  });
});

await runTest("rejects empty PromptInput messages", () => {
  assert.equal(createCaseAssistantPromptMessage(" \n\t "), null);
});

await runTest("submits on Enter and keeps Shift+Enter for new lines", () => {
  assert.equal(shouldSubmitPromptInputKey({ key: "Enter" }), true);
  assert.equal(shouldSubmitPromptInputKey({ key: "Enter", shiftKey: true }), false);
  assert.equal(shouldSubmitPromptInputKey({ key: "Enter", isComposing: true }), false);
  assert.equal(shouldSubmitPromptInputKey({ key: "a" }), false);
});

await runTest("exposes send and stop action state for accessible controls", () => {
  assert.deepEqual(
    getPromptInputActionState({
      canStop: false,
      disabled: false,
      isBusy: false,
      text: "Show open cases"
    }),
    {
      primaryAction: "send",
      label: "Send",
      disabled: false
    }
  );

  assert.deepEqual(
    getPromptInputActionState({
      canStop: true,
      disabled: false,
      isBusy: true,
      text: "Streaming response"
    }),
    {
      primaryAction: "stop",
      label: "Stop response",
      disabled: false
    }
  );
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}
