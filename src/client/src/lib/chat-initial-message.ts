const pendingInitialMessagePrefix = "vaoig-chat-initial:";

export function createChatPath(chatId: string) {
  return `/chat/${encodeURIComponent(chatId)}`;
}

export function storePendingInitialChatMessage(chatId: string, message: string) {
  const trimmedMessage = message.trim();

  if (!trimmedMessage || typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(createStorageKey(chatId), trimmedMessage);
  } catch {
    // Session storage can be unavailable in private or locked-down browser modes.
  }
}

export function takePendingInitialChatMessage(chatId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const key = createStorageKey(chatId);

  try {
    const message = window.sessionStorage.getItem(key);
    window.sessionStorage.removeItem(key);
    return message?.trim() || null;
  } catch {
    return null;
  }
}

function createStorageKey(chatId: string) {
  return `${pendingInitialMessagePrefix}${chatId}`;
}
