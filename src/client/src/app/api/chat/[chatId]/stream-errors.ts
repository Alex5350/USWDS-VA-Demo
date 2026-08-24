import { consumeStream } from "ai";

const genericChatStreamErrorMessage = "Unable to complete the assistant response.";

export function consumeChatSseStream({ stream }: { stream: ReadableStream<string> }) {
  return consumeStream({ stream, onError: logChatStreamError });
}

export function getChatStreamErrorMessage(error: unknown) {
  logChatStreamError(error);
  return genericChatStreamErrorMessage;
}

export function logChatStreamError(error: unknown) {
  console.error("Case assistant stream failed.", error);
}
