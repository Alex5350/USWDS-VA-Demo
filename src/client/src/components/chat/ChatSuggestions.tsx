"use client";

import type { CaseAssistantSuggestion } from "@/lib/chat-suggestions";

type ChatSuggestionsProps = {
  suggestions: CaseAssistantSuggestion[];
  disabled?: boolean;
  onSelect: (prompt: string) => void;
};

export function ChatSuggestions({ suggestions, disabled = false, onSelect }: ChatSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="case-assistant-suggestions-heading" className="chat-suggestions">
      <div className="chat-suggestions__header">
        <h3 id="case-assistant-suggestions-heading">Suggested questions</h3>
        <p className="status-text">Grounded in the synthetic case dataset.</p>
      </div>
      <div className="chat-suggestions__grid">
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
