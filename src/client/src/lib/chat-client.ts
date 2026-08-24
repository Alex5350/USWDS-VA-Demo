const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
const demoUserStorageKey = "vaoig-fwa-demo-user";
const defaultDemoUserEmail = "demo.readonly@local";

export type ChatRequestOptions = {
  demoUserEmail?: string;
  headers?: HeadersInit;
};

export type ChatRole = "user" | "assistant" | "system" | "tool";

export type ChatSession = {
  chatId: string;
  title: string | null;
  createdAt: string;
  lastMessageAt: string | null;
};

export type ChatMessage = {
  messageId: number;
  role: ChatRole;
  content: string;
  clientMessageId: string | null;
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
  role: ChatRole;
  content: string;
  clientMessageId?: string | null;
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

export function createChatHeaders(demoUserEmail: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Demo-User": demoUserEmail
  };
}

export function getChatAuthHeaders(): Record<string, string> {
  return createChatHeaders(getBrowserSelectedDemoUserEmail());
}

async function requestChatJson<T>(path: string, init?: RequestInit, options?: ChatRequestOptions): Promise<T> {
  const response = await requestChat(path, init, options);
  return (await response.json()) as T;
}

async function requestChatNoContent(path: string, init?: RequestInit, options?: ChatRequestOptions): Promise<void> {
  await requestChat(path, init, options);
}

async function requestChat(path: string, init?: RequestInit, options?: ChatRequestOptions) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: mergeHeaders(options, init?.headers)
  });

  if (!response.ok) {
    throw await createChatApiError(response, path);
  }

  return response;
}

function getBrowserSelectedDemoUserEmail() {
  if (typeof window === "undefined") {
    return defaultDemoUserEmail;
  }

  try {
    return window.sessionStorage.getItem(demoUserStorageKey) ?? defaultDemoUserEmail;
  } catch {
    return defaultDemoUserEmail;
  }
}

function mergeHeaders(options?: ChatRequestOptions, initHeaders?: HeadersInit) {
  const merged = new Headers(createChatHeaders(options?.demoUserEmail ?? getBrowserSelectedDemoUserEmail()));

  if (options?.headers) {
    new Headers(options.headers).forEach((value, key) => {
      merged.set(key, value);
    });
  }

  if (initHeaders) {
    new Headers(initHeaders).forEach((value, key) => {
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
  const contentType = response.headers.get("Content-Type")?.toLowerCase() ?? "";

  if (!text) {
    return "";
  }

  if (contentType.includes("json")) {
    try {
      return sanitizeErrorDetail(getProblemDetail(JSON.parse(text)));
    } catch {
      return "";
    }
  }

  if (isSafePlainTextError(response.status, contentType, text)) {
    return sanitizeErrorDetail(text);
  }

  return "";
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

function isSafePlainTextError(status: number, contentType: string, text: string) {
  const normalized = text.trim();

  return (
    status === 400 &&
    normalized.length > 0 &&
    normalized.length <= 300 &&
    !/[<>{}]/.test(normalized) &&
    !/[\r\n]/.test(normalized) &&
    (!contentType || contentType.startsWith("text/"))
  );
}

function sanitizeErrorDetail(detail: string | undefined) {
  const normalized = detail?.trim();

  if (!normalized) {
    return "";
  }

  return normalized.length > 500 ? `${normalized.slice(0, 500)}...` : normalized;
}

function chatSessionPath(chatId: string) {
  return `/api/chat/sessions/${encodeURIComponent(chatId)}`;
}

export async function createChatSession(firstMessage: string, options?: ChatRequestOptions): Promise<ChatSession> {
  return requestChatJson<ChatSession>(
    "/api/chat/sessions",
    {
      method: "POST",
      body: JSON.stringify({ firstMessage } satisfies CreateChatSessionRequest)
    },
    options
  );
}

export async function listChatSessions(options?: ChatRequestOptions): Promise<ChatSession[]> {
  return requestChatJson<ChatSession[]>("/api/chat/sessions", undefined, options);
}

export async function getChatConversation(chatId: string, options?: ChatRequestOptions): Promise<ChatConversation> {
  return requestChatJson<ChatConversation>(chatSessionPath(chatId), undefined, options);
}

export async function renameChatSession(chatId: string, title: string, options?: ChatRequestOptions): Promise<void> {
  return requestChatNoContent(
    chatSessionPath(chatId),
    {
      method: "PATCH",
      body: JSON.stringify({ title })
    },
    options
  );
}

export async function softDeleteChatSession(chatId: string, options?: ChatRequestOptions): Promise<void> {
  return requestChatNoContent(
    chatSessionPath(chatId),
    {
      method: "PATCH",
      body: JSON.stringify({ isDeleted: true })
    },
    options
  );
}

export async function deleteChatSession(chatId: string, options?: ChatRequestOptions): Promise<void> {
  return requestChatNoContent(
    chatSessionPath(chatId),
    {
      method: "DELETE"
    },
    options
  );
}

export async function addChatMessage(
  chatId: string,
  request: AddChatMessageRequest,
  options?: ChatRequestOptions
): Promise<ChatMessage> {
  return requestChatJson<ChatMessage>(
    `${chatSessionPath(chatId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    options
  );
}

export async function addChatToolCall(
  chatId: string,
  request: AddChatToolCallRequest,
  options?: ChatRequestOptions
): Promise<ChatToolCall> {
  return requestChatJson<ChatToolCall>(
    `${chatSessionPath(chatId)}/tool-calls`,
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    options
  );
}

export async function addChatContextItem(
  chatId: string,
  request: AddChatContextItemRequest,
  options?: ChatRequestOptions
): Promise<ChatContextItem> {
  return requestChatJson<ChatContextItem>(
    `${chatSessionPath(chatId)}/context`,
    {
      method: "POST",
      body: JSON.stringify(request)
    },
    options
  );
}

export async function deleteChatContextItem(
  chatId: string,
  contextItemId: number,
  options?: ChatRequestOptions
): Promise<void> {
  return requestChatNoContent(
    `${chatSessionPath(chatId)}/context/${contextItemId}`,
    {
      method: "DELETE"
    },
    options
  );
}
