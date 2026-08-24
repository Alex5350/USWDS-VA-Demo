import assert from "node:assert/strict";

import {
  ChatApiError,
  deleteChatSession,
  listChatSessions,
  softDeleteChatSession,
  type AddChatMessageRequest,
  type ChatRole
} from "./chat-client";

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>;

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

await runTest("explicit demo user option sets X-Demo-User", async () => {
  let observedHeaders: Headers | undefined;

  await withFetchStub(
    (_input, init) => {
      observedHeaders = new Headers(init?.headers);
      return Response.json([]);
    },
    async () => {
      await listChatSessions({ demoUserEmail: "demo.analyst@local" });
    }
  );

  assert.equal(observedHeaders?.get("X-Demo-User"), "demo.analyst@local");
});

await runTest("204 no-content response succeeds", async () => {
  await withFetchStub(
    () => new Response(null, { status: 204 }),
    async () => {
      await softDeleteChatSession("1f93a7bb-4e05-46b8-b05b-36cf7f988c49", {
        demoUserEmail: "demo.analyst@local"
      });
    }
  );
});

await runTest("hard delete sends DELETE to chat session endpoint", async () => {
  let observedInput = "";
  let observedMethod = "";

  await withFetchStub(
    (input, init) => {
      observedInput = String(input);
      observedMethod = init?.method ?? "GET";
      return new Response(null, { status: 204 });
    },
    async () => {
      await deleteChatSession("1f93a7bb-4e05-46b8-b05b-36cf7f988c49", {
        demoUserEmail: "demo.analyst@local"
      });
    }
  );

  assert.equal(new URL(observedInput).pathname, "/api/chat/sessions/1f93a7bb-4e05-46b8-b05b-36cf7f988c49");
  assert.equal(observedMethod, "DELETE");
});

await runTest("non-JSON 500 does not leak raw response body", async () => {
  await withFetchStub(
    () =>
      new Response("<html><body>proxy failure with internal host details</body></html>", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/html" }
      }),
    async () => {
      try {
        await listChatSessions({ demoUserEmail: "demo.analyst@local" });
      } catch (error) {
        assert.ok(error instanceof ChatApiError);
        assert.equal(error.status, 500);
        assert.equal(error.path, "/api/chat/sessions");
        assert.match(error.message, /500/);
        assert.doesNotMatch(error.message, /proxy failure with internal host details/);
        assert.doesNotMatch(error.message, /<html>/);
        return;
      }

      assert.fail("Expected ChatApiError");
    }
  );
});

await runTest("chat role union supports persistence request roles", () => {
  const role: ChatRole = "tool";
  const request: AddChatMessageRequest = { role, content: "Tool output" };

  assert.equal(request.role, "tool");
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}
