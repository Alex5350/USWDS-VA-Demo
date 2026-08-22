export type CaseAssistantPromptInputMessage = {
  text: string;
  files?: File[];
};

export type PromptInputKeyState = {
  key: string;
  shiftKey?: boolean;
  isComposing?: boolean;
};

export type PromptInputActionState = {
  primaryAction: "send" | "stop";
  label: "Send" | "Stop response";
  disabled: boolean;
};

export function createCaseAssistantPromptMessage(value: string): CaseAssistantPromptInputMessage | null {
  const text = value.trim();

  if (!text) {
    return null;
  }

  return { text };
}

export function shouldSubmitPromptInputKey(state: PromptInputKeyState) {
  return state.key === "Enter" && state.shiftKey !== true && state.isComposing !== true;
}

export function getPromptInputActionState({
  canStop,
  disabled,
  isBusy,
  text
}: {
  canStop: boolean;
  disabled: boolean;
  isBusy: boolean;
  text: string;
}): PromptInputActionState {
  if (canStop) {
    return {
      primaryAction: "stop",
      label: "Stop response",
      disabled
    };
  }

  return {
    primaryAction: "send",
    label: "Send",
    disabled: disabled || isBusy || text.trim().length === 0
  };
}
