"use client";

import { useId, useState } from "react";

import type { CaseAssistantSuggestion } from "@/lib/chat-suggestions";
import { getChatSuggestionsPanelState } from "@/lib/chat-suggestions-panel";

type ChatSuggestionsProps = {
  suggestions: CaseAssistantSuggestion[];
  disabled?: boolean;
  onSelect: (prompt: string) => void;
};

export function ChatSuggestions({ suggestions, disabled = false, onSelect }: ChatSuggestionsProps) {
  const suggestionsGridId = useId();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelState = getChatSuggestionsPanelState({
    isCollapsed,
    suggestionCount: suggestions.length
  });

  if (!panelState) {
    return null;
  }

  return (
    <section aria-labelledby="case-assistant-suggestions-heading" className="chat-suggestions">
      <div className="chat-suggestions__header">
        <div className="chat-suggestions__heading">
          <h3 id="case-assistant-suggestions-heading">Suggested questions</h3>
          <p className="status-text">{panelState.statusText}</p>
        </div>
        <button
          aria-controls={suggestionsGridId}
          aria-expanded={panelState.ariaExpanded}
          className="chat-suggestions__toggle"
          onClick={() => setIsCollapsed((currentValue) => !currentValue)}
          type="button"
        >
          {panelState.toggleLabel}
        </button>
      </div>
      <div className="chat-suggestions__grid" hidden={!panelState.isVisible} id={suggestionsGridId}>
        {suggestions.map((suggestion) => (
          <button
            className="chat-suggestions__item"
            disabled={disabled}
            key={suggestion.prompt}
            onClick={() => onSelect(suggestion.prompt)}
            type="button"
          >
            <span className="chat-suggestions__label">{suggestion.label}</span>
            <span className="chat-suggestions__prompt">{suggestion.prompt}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
