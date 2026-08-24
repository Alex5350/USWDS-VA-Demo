"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent
} from "react";

import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import { UsaButton } from "@/components/uswds/UsaButton";
import {
  createCaseAssistantPromptMessage,
  getPromptInputActionState,
  shouldFocusPromptInput,
  shouldSubmitPromptInputKey,
  type CaseAssistantPromptInputMessage
} from "@/lib/case-assistant-prompt-input";
import type { CaseAssistantSuggestion } from "@/lib/chat-suggestions";

type CaseAssistantPromptInputProps = {
  value: string;
  suggestions?: CaseAssistantSuggestion[];
  allowWebSearch: boolean;
  isBusy: boolean;
  canStop: boolean;
  disabled?: boolean;
  focusKey?: string;
  onValueChange: (value: string) => void;
  onAllowWebSearchChange: (checked: boolean) => void;
  onSuggestionSelect?: (prompt: string) => void;
  onSubmit: (message: CaseAssistantPromptInputMessage) => void | Promise<void>;
  onStop: () => void | Promise<void>;
};

export function CaseAssistantPromptInput({
  value,
  suggestions = [],
  allowWebSearch,
  isBusy,
  canStop,
  disabled = false,
  focusKey,
  onValueChange,
  onAllowWebSearchChange,
  onSuggestionSelect,
  onSubmit,
  onStop
}: CaseAssistantPromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastFocusedKeyRef = useRef<string | null>(null);
  const isComposerDisabled = disabled || isBusy;
  const actionState = getPromptInputActionState({
    canStop,
    disabled,
    isBusy,
    text: value
  });

  useLayoutEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  useEffect(() => {
    if (
      !shouldFocusPromptInput({
        focusKey,
        isComposerDisabled,
        lastFocusedKey: lastFocusedKeyRef.current
      })
    ) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea || textarea.disabled) {
        return;
      }

      textarea.focus({ preventScroll: true });
      lastFocusedKeyRef.current = focusKey ?? null;
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [focusKey, isComposerDisabled]);

  function focusTextarea() {
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
  }

  function submitCurrentMessage() {
    const message = createCaseAssistantPromptMessage(value);

    if (!message || actionState.disabled || actionState.primaryAction !== "send") {
      return;
    }

    void onSubmit(message);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (actionState.primaryAction === "stop") {
      void onStop();
      return;
    }

    submitCurrentMessage();
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      !shouldSubmitPromptInputKey({
        key: event.key,
        shiftKey: event.shiftKey,
        isComposing: event.nativeEvent.isComposing
      })
    ) {
      return;
    }

    event.preventDefault();
    submitCurrentMessage();
  }

  return (
    <form className="chat-composer case-prompt-input usa-form" onSubmit={handleSubmit}>
      <ChatSuggestions
        disabled={isComposerDisabled}
        onSelect={(prompt) => {
          if (onSuggestionSelect) {
            onSuggestionSelect(prompt);
          } else {
            onValueChange(prompt);
          }

          focusTextarea();
        }}
        suggestions={suggestions}
      />

      <div className="usa-form-group chat-composer__field case-prompt-input__body">
        <label className="usa-label" htmlFor="case-assistant-message">
          Message the case assistant
        </label>
        <textarea
          aria-describedby="case-assistant-message-hint"
          className="usa-textarea chat-composer__textarea case-prompt-input__textarea"
          disabled={isComposerDisabled}
          id="case-assistant-message"
          name="message"
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleTextareaKeyDown}
          placeholder="Ask about open cases, provider risk, case aging, or a synthetic case ID."
          ref={textareaRef}
          rows={3}
          value={value}
        />
        <div className="usa-hint chat-composer__hint" id="case-assistant-message-hint">
          Press Enter to send, or Shift+Enter for a new line. The assistant is read-only and uses synthetic demo case data.
        </div>
      </div>

      <div className="chat-composer__controls case-prompt-input__footer">
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

        <div className="action-row chat-composer__actions case-prompt-input__actions">
          <UsaButton
            className="chat-composer__send case-prompt-input__submit"
            disabled={actionState.disabled}
            type={actionState.primaryAction === "send" ? "submit" : "button"}
            variant={actionState.primaryAction === "send" ? "default" : "secondary"}
            onClick={
              actionState.primaryAction === "stop"
                ? () => {
                    void onStop();
                  }
                : undefined
            }
          >
            {actionState.label}
          </UsaButton>
        </div>
      </div>
    </form>
  );
}
