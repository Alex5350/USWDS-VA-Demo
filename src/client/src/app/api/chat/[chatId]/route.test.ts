import assert from "node:assert/strict";

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>;

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const originalGoogleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

process.env.NEXT_PUBLIC_API_BASE_URL = "http://dotnet.test";
delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

const { POST } = await import("./route");

async function withFetchStub(handler: FetchHandler, run: () => Promise<void>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;

  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function createRequest(
  messages: unknown[],
  options: { demoUserEmail?: string; headerDemoUserEmail?: string } = {}
) {
  const headers = new Headers({ "Content-Type": "application/json" });

  if (options.headerDemoUserEmail) {
    headers.set("X-Demo-User", options.headerDemoUserEmail);
  }

  return new Request("http://localhost/api/chat/session-1", {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
      demoUserEmail: options.demoUserEmail ?? "demo.analyst@local"
    })
  });
}

function createContext(chatId = "session 1") {
  return {
    params: Promise.resolve({ chatId })
  };
}

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("persists latest validated user message before streaming", async () => {
  const calls: FetchCall[] = [];

  await withFetchStub(
    (input, init) => {
      calls.push({ input, init });
      return Response.json({ messageId: 101 });
    },
    async () => {
      const response = await POST(
        await createRequest([
          {
            id: "message-1",
            role: "user",
            parts: [
              { type: "text", text: "  How many " },
              { type: "text", text: "open cases?  " }
            ]
          }
        ]),
        createContext("session 1")
      );

      assert.equal(response.status, 500);
    }
  );

  assert.equal(calls.length, 1);
  assert.equal(String(calls[0]?.input), "http://dotnet.test/api/chat/sessions/session%201/messages");
  assert.equal(calls[0]?.init?.method, "POST");

  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get("Content-Type"), "application/json");
  assert.equal(headers.get("X-Demo-User"), "demo.analyst@local");
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), {
    role: "user",
    content: "How many open cases?",
    model: null,
    clientMessageId: "message-1"
  });
});

await runTest("prefers X-Demo-User header over body demo user for route persistence", async () => {
  const calls: FetchCall[] = [];

  await withFetchStub(
    (input, init) => {
      calls.push({ input, init });
      return Response.json({ messageId: 101 });
    },
    async () => {
      const response = await POST(
        await createRequest(
          [
            {
              id: "message-1",
              role: "user",
              parts: [{ type: "text", text: "Show risk queue" }]
            }
          ],
          {
            demoUserEmail: "demo.body@local",
            headerDemoUserEmail: "demo.header@local"
          }
        ),
        createContext()
      );

      assert.equal(response.status, 500);
    }
  );

  assert.equal(calls.length, 1);
  const headers = new Headers(calls[0]?.init?.headers);
  assert.equal(headers.get("X-Demo-User"), "demo.header@local");
});

await runTest("returns generic error when chat message persistence fails", async () => {
  await withFetchStub(
    () =>
      new Response("<html><body>internal proxy failure</body></html>", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/html" }
      }),
    async () => {
      const response = await POST(
        await createRequest([
          {
            id: "message-1",
            role: "user",
            parts: [{ type: "text", text: "Show risk queue" }]
          }
        ]),
        createContext()
      );

      assert.equal(response.status, 502);
      const body = (await response.json()) as { error?: string };
      assert.equal(body.error, "Unable to persist chat message.");
      assert.doesNotMatch(body.error, /internal proxy failure/);
      assert.doesNotMatch(body.error, /<html>/);
    }
  );
});

restoreEnv("NEXT_PUBLIC_API_BASE_URL", originalApiBaseUrl);
restoreEnv("GOOGLE_GENERATIVE_AI_API_KEY", originalGoogleApiKey);

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
