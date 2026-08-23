import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { NextResponse } from "next/server";

import { createCaseAssistantOptions } from "./agent";

export const runtime = "nodejs";
export const maxDuration = 30;

const defaultDemoUserEmail = "demo.readonly@local";

type ChatRouteContext = {
  params: Promise<{
    chatId: string;
  }>;
};

type ChatRouteBody = {
  messages?: UIMessage[];
  demoUserEmail?: string;
  allowWebSearch?: boolean;
};

export async function POST(request: Request, { params }: ChatRouteContext) {
  const { chatId } = await params;
  const body = await readBody(request);

  if (body instanceof Response) {
    return body;
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

  if (body.messages !== undefined && !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Request body field 'messages' must be an array when provided." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  const bodyDemoUserEmail = typeof body.demoUserEmail === "string" ? body.demoUserEmail : undefined;
  const demoUserEmail = getDemoUserEmail(bodyDemoUserEmail, request.headers.get("X-Demo-User"));
  const allowWebSearch = body.allowWebSearch === true;
  const options = createCaseAssistantOptions(chatId, demoUserEmail, { allowWebSearch });
  const messagesWithoutIds = stripMessageIds(messages);
  const modelMessages = await convertToModelMessages(messagesWithoutIds, {
    tools: options.tools,
    ignoreIncompleteToolCalls: true
  });

  const result = streamText({
    ...options,
    messages: modelMessages
  });

  return result.toUIMessageStreamResponse();
}

async function readBody(request: Request): Promise<ChatRouteBody | Response> {
  try {
    const parsed = (await request.json()) as unknown;
    return isRecord(parsed) ? (parsed as ChatRouteBody) : {};
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}

function getDemoUserEmail(bodyEmail: string | undefined, headerEmail: string | null) {
  const candidate = bodyEmail ?? headerEmail ?? defaultDemoUserEmail;
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : defaultDemoUserEmail;
}

function stripMessageIds(messages: UIMessage[]): Array<Omit<UIMessage, "id">> {
  return messages.map(({ id: _id, ...message }) => message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
