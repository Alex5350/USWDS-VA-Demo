import type { UIMessage } from "ai";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
type PersistedChatRole = "user" | "assistant";

type PersistChatMessageRequest = {
  role: PersistedChatRole;
  content: string;
  clientMessageId?: string | null;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  finishReason?: string | null;
};

export type AssistantMessageMetadata = {
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  finishReason?: string | null;
};

export async function persistLatestUserMessage<TMessage extends UIMessage>(
  chatId: string,
  demoUserEmail: string,
  messages: TMessage[]
) {
  const latestMessage = messages.at(-1);

  if (latestMessage?.role !== "user") {
    return;
  }

  const content = getTextPartContent(latestMessage.parts).trim();

  if (!content) {
    return;
  }

  await persistChatMessage(chatId, demoUserEmail, {
    role: "user",
    content,
    model: null,
    clientMessageId: latestMessage.id
  });
}

export async function persistAssistantResponseMessage<TMessage extends UIMessage>(
  chatId: string,
  demoUserEmail: string,
  responseMessage: TMessage,
  metadata: AssistantMessageMetadata
) {
  await persistChatMessage(chatId, demoUserEmail, {
    role: "assistant",
    content: getTextPartContent(responseMessage.parts).trim(),
    model: metadata.model ?? null,
    promptTokens: metadata.promptTokens ?? null,
    completionTokens: metadata.completionTokens ?? null,
    finishReason: metadata.finishReason ?? null,
    clientMessageId: responseMessage.id
  });
}

export async function createAssistantMessageId(latestUserMessageId: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(latestUserMessageId));
  const hex = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `assistant:${hex.slice(0, 48)}`;
}

export function createChatPersistenceError() {
  return new Error("Unable to persist chat message.");
}

async function persistChatMessage(chatId: string, demoUserEmail: string, request: PersistChatMessageRequest) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/chat/sessions/${encodeURIComponent(chatId)}/messages`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "X-Demo-User": demoUserEmail
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw createChatPersistenceError();
    }
  } catch {
    throw createChatPersistenceError();
  }
}

function getTextPartContent(parts: UIMessage["parts"]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
