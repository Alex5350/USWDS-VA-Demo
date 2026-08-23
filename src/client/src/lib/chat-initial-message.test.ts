import assert from "node:assert/strict";

import { createChatPath } from "./chat-initial-message";

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("chat path never includes first message text", () => {
  const firstMessage = "Show critical-risk cases assigned to Demo Analyst.";
  const path = createChatPath("11111111-1111-1111-1111-111111111111");

  assert.equal(path, "/chat/11111111-1111-1111-1111-111111111111");
  assert.equal(path.includes("?"), false);
  assert.doesNotMatch(path, /critical-risk|Demo Analyst|Show/);
  assert.equal(firstMessage.length > 0, true);
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}
