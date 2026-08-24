import assert from "node:assert/strict";

const { getChatStreamErrorMessage } = await import("./stream-errors");

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("returns generic stream error message and logs original error", () => {
  const originalError = console.error;
  const calls: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };

  try {
    const message = getChatStreamErrorMessage(new Error("backend leaked internal host"));

    assert.equal(message, "Unable to complete the assistant response.");
    assert.doesNotMatch(message, /backend leaked internal host/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.[0], "Case assistant stream failed.");
    assert.ok(calls[0]?.[1] instanceof Error);
  } finally {
    console.error = originalError;
  }
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}
