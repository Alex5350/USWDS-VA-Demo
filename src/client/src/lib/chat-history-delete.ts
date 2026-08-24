export type ChatDeleteDialogState = {
  heading: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  controlsDisabled: boolean;
};

export function getChatDeleteDialogState({
  pendingTitle,
  isDeleting
}: {
  pendingTitle: string | null;
  isDeleting: boolean;
}): ChatDeleteDialogState | null {
  if (pendingTitle === null) {
    return null;
  }

  const title = pendingTitle.trim() || "New chat";

  return {
    heading: `Delete "${title}"?`,
    body: "This permanently deletes the saved conversation, messages, tool activity, and pinned context. This cannot be undone.",
    confirmLabel: isDeleting ? "Deleting..." : "Delete conversation",
    cancelLabel: "Cancel",
    controlsDisabled: isDeleting
  };
}
