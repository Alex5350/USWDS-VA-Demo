const defaultChatTitle = "New chat";
const maxChatTitleLength = 80;
const truncatedChatTitleLength = 77;

export type ChatMessagePart = {
  type?: string;
  text?: unknown;
  [key: string]: unknown;
};

export function createChatTitle(firstMessage: string) {
  const title = firstMessage.replace(/\s+/g, " ").trim();

  if (!title) {
    return defaultChatTitle;
  }

  return title.length > maxChatTitleLength ? `${title.slice(0, truncatedChatTitleLength)}...` : title;
}

export function getMessageText(parts: readonly ChatMessagePart[] | null | undefined) {
  if (!parts) {
    return "";
  }

  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");
}
