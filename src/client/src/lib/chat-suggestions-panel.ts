export type ChatSuggestionsPanelState = {
  isVisible: boolean;
  toggleLabel: "Hide suggestions" | "Show suggestions";
  statusText: string;
  ariaExpanded: boolean;
};

export function getChatSuggestionsPanelState({
  isCollapsed,
  suggestionCount
}: {
  isCollapsed: boolean;
  suggestionCount: number;
}): ChatSuggestionsPanelState | null {
  if (suggestionCount <= 0) {
    return null;
  }

  if (isCollapsed) {
    return {
      isVisible: false,
      toggleLabel: "Show suggestions",
      statusText: `${suggestionCount} ${suggestionCount === 1 ? "suggestion" : "suggestions"} available.`,
      ariaExpanded: false
    };
  }

  return {
    isVisible: true,
    toggleLabel: "Hide suggestions",
    statusText: "Grounded in the synthetic case dataset.",
    ariaExpanded: true
  };
}
