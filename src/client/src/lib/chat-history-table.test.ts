import assert from "node:assert/strict";

import {
  chatHistoryPageSizeOptions,
  getChatHistoryPage,
  getChatHistoryRow,
  normalizeChatHistoryPaging,
  type ChatHistoryQuery
} from "./chat-history-table";
import type { ChatSession } from "./chat-client";

const failures: string[] = [];

async function runTest(name: string, run: () => Promise<void> | void) {
  try {
    await run();
  } catch (error) {
    failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

await runTest("normalizes invalid page and page size values", () => {
  const query: ChatHistoryQuery = { page: "0", pageSize: "999" };

  assert.deepEqual(normalizeChatHistoryPaging(query, 41), {
    page: 1,
    pageSize: chatHistoryPageSizeOptions[0],
    totalItems: 41,
    totalPages: 5
  });
});

await runTest("sorts by latest activity and returns one page", () => {
  const page = getChatHistoryPage(
    [
      createSession("old-chat", "Old", "2026-06-01T12:00:00", null),
      createSession("recent-message", "Recent message", "2026-06-01T12:00:00", "2026-06-04T12:00:00"),
      createSession("new-chat", "New", "2026-06-03T12:00:00", null),
      ...Array.from({ length: 10 }, (_, index) =>
        createSession(`filler-${index}`, `Filler ${index}`, `2026-05-${String(index + 1).padStart(2, "0")}T12:00:00`, null)
      )
    ],
    { page: "1", pageSize: "10" }
  );

  assert.deepEqual(
    page.rows.map((row) => row.chatId),
    ["recent-message", "new-chat", "old-chat", "filler-9", "filler-8", "filler-7", "filler-6", "filler-5", "filler-4", "filler-3"]
  );
  assert.equal(page.paging.totalItems, 13);
  assert.equal(page.paging.totalPages, 2);
});

await runTest("uses a fallback title and last activity for table rows", () => {
  const row = getChatHistoryRow(createSession("11111111-2222-3333-4444-555555555555", "   ", "2026-06-01", null));

  assert.equal(row.title, "New chat");
  assert.equal(row.shortChatId, "11111111");
  assert.equal(row.lastActivityAt, "2026-06-01");
});

if (failures.length > 0) {
  assert.fail(failures.join("\n\n"));
}

function createSession(chatId: string, title: string | null, createdAt: string, lastMessageAt: string | null): ChatSession {
  return {
    chatId,
    title,
    createdAt,
    lastMessageAt
  };
}
