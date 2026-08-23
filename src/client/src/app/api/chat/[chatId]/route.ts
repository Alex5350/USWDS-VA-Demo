import {
  consumeStream,
  convertToModelMessages,
  safeValidateUIMessages,
  streamText,
  type InferUITools,
  type UIMessage
} from "ai";
import { NextResponse } from "next/server";

import { createCaseAssistantOptions } from "./agent";
import {
  createAssistantMessageId,
  persistAssistantResponseMessage,
  persistLatestUserMessage,
  type AssistantMessageMetadata
} from "./persistence";
import type { CaseAssistantTools } from "./tools";

export const runtime = "nodejs";
export const maxDuration = 30;

const defaultDemoUserEmail = "demo.readonly@local";

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
  const assistantMessageId = createAssistantMessageId(getLatestUserMessageId(validatedMessages) ?? crypto.randomUUID());
  let assistantMetadata: AssistantMessageMetadata = {};

  const result = streamText({
    ...options,
    messages: modelMessages,
    onFinish: (event) => {
      assistantMetadata = {
        model: event.response.modelId ?? event.model.modelId,
        promptTokens: event.totalUsage.inputTokens ?? null,
        completionTokens: event.totalUsage.outputTokens ?? null,
        finishReason: event.finishReason
      };
    }
  });

  return result.toUIMessageStreamResponse({
    originalMessages: validatedMessages,
    generateMessageId: () => assistantMessageId,
    consumeSseStream: consumeStream,
    onFinish: async ({ responseMessage, finishReason }) => {
      await persistAssistantResponseMessage(chatId, demoUserEmail, responseMessage, {
        ...assistantMetadata,
        finishReason: assistantMetadata.finishReason ?? finishReason ?? null
      });
    }
  });
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
  return normalizeOptional(headerEmail) ?? normalizeOptional(bodyEmail) ?? defaultDemoUserEmail;
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

function getLatestUserMessageId(messages: CaseAssistantUIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      return messages[index].id;
    }
  }

  return null;
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
