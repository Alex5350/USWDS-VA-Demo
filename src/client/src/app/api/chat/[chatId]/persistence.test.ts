import assert from "node:assert/strict";
import type { UIMessage } from "ai";

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>;

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
process.env.NEXT_PUBLIC_API_BASE_URL = "http://dotnet.test";

const { createAssistantMessageId, persistAssistantResponseMessage } = await import("./persistence");

async function withFetchStub(handler: FetchHandler, run: () => Promise<void>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("persists assistant response metadata even when content is empty", async () => {
  const calls: FetchCall[] = [];
  const responseMessage = {
    id: "assistant-for-message-1",
    role: "assistant",
    parts: []
  } satisfies UIMessage;

  await withFetchStub(
    (input, init) => {
      calls.push({ input, init });
      return Response.json({ messageId: 202 });
    },
    async () => {
      await persistAssistantResponseMessage(
        "session 1",
        "demo.analyst@local",
        responseMessage,
        {
          model: "gemini-final",
          promptTokens: 34,
          completionTokens: 12,
          finishReason: "tool-calls"
        }
      );
    }
  );

  assert.equal(calls.length, 1);
  assert.equal(String(calls[0]?.input), "http://dotnet.test/api/chat/sessions/session%201/messages");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    role: "assistant",
    content: "",
    model: "gemini-final",
    promptTokens: 34,
    completionTokens: 12,
    finishReason: "tool-calls",
    clientMessageId: "assistant-for-message-1"
  });
});

await runTest("creates deterministic assistant message id from latest user message id", () => {
  assert.equal(createAssistantMessageId("message-1"), "message-1:assistant");
});

restoreEnv("NEXT_PUBLIC_API_BASE_URL", originalApiBaseUrl);

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
