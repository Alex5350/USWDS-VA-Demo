import { convertToModelMessages, safeValidateUIMessages, streamText, type InferUITools, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { createCaseAssistantOptions } from "./agent";
import type { CaseAssistantTools } from "./tools";

export const runtime = "nodejs";
export const maxDuration = 30;

const defaultDemoUserEmail = "demo.readonly@local";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

type ChatRouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

type ChatRouteBody = {
  messages?: unknown;
  demoUserEmail?: unknown;
  allowWebSearch?: unknown;
};

type CaseAssistantUIMessage = UIMessage<unknown, never, InferUITools<CaseAssistantTools>>;

type PersistedChatRole = "user" | "assistant";

type PersistChatMessageRequest = {
  role: PersistedChatRole;
  content: string;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  finishReason?: string | null;
};

export async function POST(request: Request, { params }: ChatRouteContext) {
  const { chatId } = await params;
  const body = await readBody(request);

  if (body instanceof Response) {
    return body;
  }

  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Request body field 'messages' must be an array." }, { status: 400 });
  }

  const bodyDemoUserEmail = typeof body.demoUserEmail === "string" ? body.demoUserEmail : undefined;
  const demoUserEmail = getDemoUserEmail(bodyDemoUserEmail, request.headers.get("X-Demo-User"));
  const allowWebSearch = body.allowWebSearch === true;
  const options = createCaseAssistantOptions(chatId, demoUserEmail, { allowWebSearch });

  const validation = await safeValidateUIMessages<CaseAssistantUIMessage>({
    messages: body.messages,
    tools: options.tools
  });

  if (!validation.success) {
    return NextResponse.json({ error: "Request body field 'messages' must contain valid UI messages." }, { status: 400 });
  }

  const validatedMessages = validation.data;

  try {
    await persistLatestUserMessage(chatId, demoUserEmail, validatedMessages);
  } catch {
    return NextResponse.json({ error: "Unable to persist chat message." }, { status: 502 });
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_GENERATIVE_AI_API_KEY is not configured. Set it before using the case assistant streaming route."
      },
      { status: 500 }
    );
  }

  const messagesWithoutIds = stripMessageIds(validatedMessages);
  const modelMessages = await convertToModelMessages(messagesWithoutIds, {
    tools: options.tools,
    ignoreIncompleteToolCalls: true
  });

  const result = streamText({
    ...options,
    messages: modelMessages,
    onFinish: async (event) => {
      const content = event.text.trim();

      if (!content) {
        return;
      }

      await persistChatMessage(chatId, demoUserEmail, {
        role: "assistant",
        content,
        model: event.model.modelId,
        promptTokens: event.usage.inputTokens ?? null,
        completionTokens: event.usage.outputTokens ?? null,
        finishReason: event.finishReason
      });
    }
  });

  return result.toUIMessageStreamResponse({
    originalMessages: validatedMessages
  });
}

async function persistLatestUserMessage(
  chatId: string,
  demoUserEmail: string,
  messages: CaseAssistantUIMessage[]
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
    model: null
  });
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

function createChatPersistenceError() {
  return new Error("Unable to persist chat message.");
}

function getTextPartContent(parts: CaseAssistantUIMessage["parts"]) {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

async function readBody(request: Request): Promise<ChatRouteBody | Response> {
  try {
    const parsed = (await request.json()) as unknown;
    if (!isRecord(parsed)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }

    return parsed;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}

function getDemoUserEmail(bodyEmail: string | undefined, headerEmail: string | null) {
  const candidate = bodyEmail ?? headerEmail ?? defaultDemoUserEmail;
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : defaultDemoUserEmail;
}

function stripMessageIds<TMessage extends UIMessage>(messages: TMessage[]): Array<Omit<TMessage, "id">> {
  return messages.map((message) => {
    const messageWithoutId = { ...message };
    Reflect.deleteProperty(messageWithoutId, "id");
    return messageWithoutId;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
