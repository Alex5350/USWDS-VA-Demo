"use client";

import type { FormEvent } from "react";

import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import { UsaButton } from "@/components/uswds/UsaButton";
import type { CaseAssistantSuggestion } from "@/lib/chat-suggestions";

type ChatComposerProps = {
  value: string;
  suggestions?: CaseAssistantSuggestion[];
  allowWebSearch: boolean;
  isBusy: boolean;
  canStop: boolean;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onAllowWebSearchChange: (checked: boolean) => void;
  onSuggestionSelect?: (prompt: string) => void;
  onSubmit: (message: string) => void | Promise<void>;
  onStop: () => void | Promise<void>;
};

export function ChatComposer({
  value,
  suggestions = [],
  allowWebSearch,
  isBusy,
  canStop,
  disabled = false,
  onValueChange,
  onAllowWebSearchChange,
  onSuggestionSelect,
  onSubmit,
  onStop
}: ChatComposerProps) {
  const trimmedValue = value.trim();
  const isComposerDisabled = disabled || isBusy;
  const canSubmit = !isComposerDisabled && trimmedValue.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void onSubmit(trimmedValue);
  }

  return (
    <form className="chat-composer usa-form" onSubmit={handleSubmit}>
      <ChatSuggestions
        disabled={isComposerDisabled}
        onSelect={(prompt) => {
          if (onSuggestionSelect) {
            onSuggestionSelect(prompt);
            return;
          }

          onValueChange(prompt);
        }}
        suggestions={suggestions}
      />

      <div className="usa-form-group chat-composer__field">
        <label className="usa-label" htmlFor="case-assistant-message">
          Message the case assistant
        </label>
        <textarea
          aria-describedby="case-assistant-message-hint"
          className="usa-textarea chat-composer__textarea"
          disabled={isComposerDisabled}
          id="case-assistant-message"
          name="message"
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Ask about open cases, provider risk, case aging, or a synthetic case ID."
          rows={5}
          value={value}
        />
        <div className="usa-hint chat-composer__hint" id="case-assistant-message-hint">
          The assistant is read-only and uses synthetic demo case data.
        </div>
      </div>

      <div className="chat-composer__controls">
        <div className="usa-checkbox chat-composer__web-search">
          <input
            checked={allowWebSearch}
            className="usa-checkbox__input"
            disabled={isComposerDisabled}
            id="case-assistant-web-search"
            name="allowWebSearch"
            onChange={(event) => onAllowWebSearchChange(event.target.checked)}
            type="checkbox"
          />
          <label className="usa-checkbox__label" htmlFor="case-assistant-web-search">
            Request web search
          </label>
        </div>

        <div className="action-row chat-composer__actions">
          <UsaButton className="chat-composer__send" disabled={!canSubmit} type="submit">
            Send
          </UsaButton>
          <UsaButton
            className="chat-composer__stop"
            disabled={!canStop || disabled}
            onClick={() => void onStop()}
            type="button"
            variant="secondary"
          >
            Stop
          </UsaButton>
        </div>
      </div>
    </form>
  );
}
