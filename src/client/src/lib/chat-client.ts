import { getSelectedDemoUser } from "@/lib/demo-auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export type ChatSession = {
  chatId: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  messageId: number;
  role: string;
  content: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
  finishReason: string | null;
  createdAt: string;
};

export type ChatToolCall = {
  toolCallId: number;
  messageId: number | null;
  toolName: string;
  allowedSurface: string;
  argumentsJson: string;
  resultSummary: string | null;
  rowCount: number | null;
  durationMs: number | null;
  succeeded: boolean;
  errorMessage: string | null;
  createdAt: string;
};

export type ChatContextItem = {
  contextItemId: number;
  messageId: number | null;
  contextType: string;
  entityType: string;
  entityId: string | null;
  label: string | null;
  snapshotJson: string | null;
  createdAt: string;
};

export type ChatConversation = {
  session: ChatSession;
  messages: ChatMessage[];
  toolCalls: ChatToolCall[];
  contextItems: ChatContextItem[];
};

export type CreateChatSessionRequest = {
  firstMessage: string;
};

export type AddChatMessageRequest = {
  role: string;
  content: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  finishReason?: string | null;
};

export type AddChatToolCallRequest = {
  messageId?: number | null;
  toolName: string;
  allowedSurface: string;
  argumentsJson: string;
  resultSummary?: string | null;
  rowCount?: number | null;
  durationMs?: number | null;
  succeeded: boolean;
  errorMessage?: string | null;
};

export type AddChatContextItemRequest = {
  messageId?: number | null;
  contextType: string;
  entityType: string;
  entityId?: string | null;
  label?: string | null;
  snapshotJson?: string | null;
};

export class ChatApiError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    message: string
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

export function getChatAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Demo-User": getSelectedDemoUser().email
  };
}

async function requestChatJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestChat(path, init);
  return (await response.json()) as T;
}

async function requestChatNoContent(path: string, init?: RequestInit): Promise<void> {
  await requestChat(path, init);
}

async function requestChat(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: mergeHeaders(init?.headers)
  });

  if (!response.ok) {
    throw await createChatApiError(response, path);
  }

  return response;
}

function mergeHeaders(headers?: HeadersInit) {
  const merged = new Headers(getChatAuthHeaders());

  if (headers) {
    new Headers(headers).forEach((value, key) => {
      merged.set(key, value);
    });
  }

  return merged;
}

async function createChatApiError(response: Response, path: string) {
  const detail = await readErrorDetail(response);
  const statusText = response.statusText ? ` ${response.statusText}` : "";
  const message = detail
    ? `Chat API request to ${path} failed with ${response.status}${statusText}: ${detail}`
    : `Chat API request to ${path} failed with ${response.status}${statusText}`;

  return new ChatApiError(response.status, path, message);
}

async function readErrorDetail(response: Response) {
  const text = await response.text();

  if (!text) {
    return "";
  }

  try {
    return getProblemDetail(JSON.parse(text)) ?? text;
  } catch {
    return text;
  }
}

function getProblemDetail(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const detail = record.detail ?? record.title ?? record.message;
    return typeof detail === "string" ? detail : undefined;
  }

  return undefined;
}

function chatSessionPath(chatId: string) {
  return `/api/chat/sessions/${encodeURIComponent(chatId)}`;
}

export async function createChatSession(firstMessage: string): Promise<ChatSession> {
  return requestChatJson<ChatSession>("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify({ firstMessage } satisfies CreateChatSessionRequest)
  });
}

export async function listChatSessions(): Promise<ChatSession[]> {
  return requestChatJson<ChatSession[]>("/api/chat/sessions");
}

export async function getChatConversation(chatId: string): Promise<ChatConversation> {
  return requestChatJson<ChatConversation>(chatSessionPath(chatId));
}

export async function renameChatSession(chatId: string, title: string): Promise<void> {
  return requestChatNoContent(chatSessionPath(chatId), {
    method: "PATCH",
    body: JSON.stringify({ title })
  });
}

export async function softDeleteChatSession(chatId: string): Promise<void> {
  return requestChatNoContent(chatSessionPath(chatId), {
    method: "PATCH",
    body: JSON.stringify({ isDeleted: true })
  });
}

export async function addChatMessage(chatId: string, request: AddChatMessageRequest): Promise<ChatMessage> {
  return requestChatJson<ChatMessage>(`${chatSessionPath(chatId)}/messages`, {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export async function addChatToolCall(chatId: string, request: AddChatToolCallRequest): Promise<ChatToolCall> {
  return requestChatJson<ChatToolCall>(`${chatSessionPath(chatId)}/tool-calls`, {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export async function addChatContextItem(chatId: string, request: AddChatContextItemRequest): Promise<ChatContextItem> {
  return requestChatJson<ChatContextItem>(`${chatSessionPath(chatId)}/context`, {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export async function deleteChatContextItem(chatId: string, contextItemId: number): Promise<void> {
  return requestChatNoContent(`${chatSessionPath(chatId)}/context/${contextItemId}`, {
    method: "DELETE"
  });
}
