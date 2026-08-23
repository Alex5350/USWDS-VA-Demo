import type { ChatSession } from "@/lib/chat-client";

export const chatHistoryPageSizeOptions = [10, 25, 50] as const;

export type ChatHistoryQuery = {
  page?: string | null;
  pageSize?: string | null;
};

export type ChatHistoryPaging = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ChatHistoryRow = {
  chatId: string;
  shortChatId: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
};

export function normalizeChatHistoryPaging(query: ChatHistoryQuery, totalItems: number): ChatHistoryPaging {
  const pageSize = parseAllowedPageSize(query.pageSize);
  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
  const requestedPage = parsePositiveInt(query.page, 1);
  const page = Math.min(Math.max(requestedPage, 1), totalPages);

  return {
    page,
    pageSize,
    totalItems,
    totalPages
  };
}

export function getChatHistoryPage(sessions: ChatSession[], query: ChatHistoryQuery) {
  const sortedRows = sessions.map(getChatHistoryRow).sort(compareChatHistoryRows);
  const paging = normalizeChatHistoryPaging(query, sortedRows.length);
  const startIndex = (paging.page - 1) * paging.pageSize;

  return {
    paging,
    rows: sortedRows.slice(startIndex, startIndex + paging.pageSize)
  };
}

export function getChatHistoryRow(session: ChatSession): ChatHistoryRow {
  const title = session.title?.trim() || "New chat";

  return {
    chatId: session.chatId,
    shortChatId: session.chatId.slice(0, 8),
    title,
    createdAt: session.createdAt,
    lastActivityAt: session.lastMessageAt ?? session.createdAt
  };
}

function compareChatHistoryRows(left: ChatHistoryRow, right: ChatHistoryRow) {
  const dateComparison = Date.parse(right.lastActivityAt) - Date.parse(left.lastActivityAt);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return right.createdAt.localeCompare(left.createdAt);
}

function parseAllowedPageSize(value: string | null | undefined) {
  const requestedPageSize = parsePositiveInt(value, chatHistoryPageSizeOptions[0]);
  return chatHistoryPageSizeOptions.includes(requestedPageSize as (typeof chatHistoryPageSizeOptions)[number])
    ? requestedPageSize
    : chatHistoryPageSizeOptions[0];
}

function parsePositiveInt(value: string | null | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
