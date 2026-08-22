"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type ChatOnFinishCallback,
  type ChatStatus,
  type UIMessage
} from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatContextPanel } from "@/components/chat/ChatContextPanel";
import { ChatHistoryPanel } from "@/components/chat/ChatHistoryPanel";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { PageHeader } from "@/components/layout/PageHeader";
import { UsaAlert } from "@/components/uswds/UsaAlert";
import {
  createChatSession,
  deleteChatContextItem,
  getChatAuthHeaders,
  getChatConversation,
  listChatSessions,
  type ChatConversation,
  type ChatMessage,
  type ChatSession
} from "@/lib/chat-client";
import {
  createChatPath,
  storePendingInitialChatMessage,
  takePendingInitialChatMessage
} from "@/lib/chat-initial-message";
import {
  getGeneratedCaseAssistantSuggestions,
  getRandomCaseAssistantSuggestions
} from "@/lib/chat-suggestions";
import { useDemoUser } from "@/lib/demo-auth";

type ChatViewProps =
  | {
      mode: "new";
    }
  | {
      mode: "existing";
      chatId: string;
    };

const fallbackDemoUserEmail = "demo.readonly@local";

type ChatLoadState = "idle" | "loading" | "loaded" | "error";

export function ChatView(props: ChatViewProps) {
  const router = useRouter();
  const { user, hasPermission } = useDemoUser();
  const canViewRiskQueue = hasPermission("CanViewRiskQueue");
  const activeChatId = props.mode === "existing" ? props.chatId : null;
  const chatDataKey = `${activeChatId ?? "new"}:${user.email}:${canViewRiskQueue}`;
  const initialSendKeyRef = useRef<string | null>(null);
  const [newChatSuggestionSeed] = useState(createClientSuggestionSeed);

  const [composerValue, setComposerValue] = useState("");
  const [pendingInitialMessage, setPendingInitialMessage] = useState<string | null>(null);
  const [allowWebSearch, setAllowWebSearch] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [loadState, setLoadState] = useState<ChatLoadState>("idle");
  const [loadedChatDataKey, setLoadedChatDataKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingContextItemId, setRemovingContextItemId] = useState<number | null>(null);
  const [generatedSuggestionState, setGeneratedSuggestionState] = useState<{
    key: string;
    suggestions: ReturnType<typeof getRandomCaseAssistantSuggestions>;
  } | null>(null);

  const transport = useMemo(
    () => createTransport(activeChatId, user.email),
    [activeChatId, user.email]
  );
  const suggestionRequestKey = `${user.email}:${newChatSuggestionSeed}`;
  const fallbackSuggestions = useMemo(
    () => getRandomCaseAssistantSuggestions(`${user.email}:${activeChatId ?? newChatSuggestionSeed}`, 4),
    [activeChatId, newChatSuggestionSeed, user.email]
  );
  const suggestions = useMemo(
    () =>
      canViewRiskQueue
        ? props.mode === "new" && generatedSuggestionState?.key === suggestionRequestKey
          ? generatedSuggestionState.suggestions
          : fallbackSuggestions
        : [],
    [canViewRiskQueue, fallbackSuggestions, generatedSuggestionState, props.mode, suggestionRequestKey]
  );

  useEffect(() => {
    if (!canViewRiskQueue || props.mode !== "new") {
      return;
    }

    const abortController = new AbortController();

    void getGeneratedCaseAssistantSuggestions({
      demoUserEmail: user.email,
      seed: newChatSuggestionSeed,
      signal: abortController.signal
    })
      .then((nextSuggestions) => {
        if (!abortController.signal.aborted) {
          setGeneratedSuggestionState({
            key: suggestionRequestKey,
            suggestions: nextSuggestions
          });
        }
      })
      .catch(() => {
        // The static suggestion set remains available when generated suggestions fail.
      });

    return () => {
      abortController.abort();
    };
  }, [canViewRiskQueue, newChatSuggestionSeed, props.mode, suggestionRequestKey, user.email]);

  const refreshConversationArtifacts = useCallback(async () => {
    if (!canViewRiskQueue) {
      return;
    }

    const [nextSessions, nextConversation] = await Promise.all([
      listChatSessions({ demoUserEmail: user.email }),
      activeChatId ? getChatConversation(activeChatId, { demoUserEmail: user.email }) : Promise.resolve(null)
    ]);

    setSessions(nextSessions);
    setConversation(nextConversation);
  }, [activeChatId, canViewRiskQueue, user.email]);

  const handleChatFinish = useCallback<ChatOnFinishCallback<UIMessage>>(
    ({ isError }) => {
      if (isError) {
        return;
      }

      void refreshConversationArtifacts().catch((error: unknown) => {
        setActionError(getErrorMessage(error));
      });
    },
    [refreshConversationArtifacts]
  );

  const { clearError, error, messages, sendMessage, setMessages, status, stop } = useChat<UIMessage>({
    id: `${activeChatId ?? "new"}:${user.email}`,
    messages: [],
    transport,
    onError: (nextError) => {
      setActionError(nextError.message);
    },
    onFinish: handleChatFinish
  });

  useEffect(() => {
    let isCurrent = true;

    initialSendKeyRef.current = null;

    async function loadPendingInitialMessage() {
      await Promise.resolve();

      if (!isCurrent) {
        return;
      }

      setPendingInitialMessage(activeChatId ? takePendingInitialChatMessage(activeChatId) : null);
    }

    void loadPendingInitialMessage();

    return () => {
      isCurrent = false;
    };
  }, [activeChatId]);

  const sendExistingMessage = useCallback(
    async (messageText: string) => {
      const trimmedMessage = messageText.trim();

      if (!activeChatId || !trimmedMessage || status === "submitted" || status === "streaming") {
        return;
      }

      setActionError(null);
      clearError();
      setComposerValue("");

      await sendMessage(
        { text: trimmedMessage },
        {
          body: {
            demoUserEmail: user.email,
            allowWebSearch
          },
          headers: {
            "X-Demo-User": user.email
          }
        }
      );
    },
    [activeChatId, allowWebSearch, clearError, sendMessage, status, user.email]
  );

  useEffect(() => {
    let isCurrent = true;

    async function loadInitialChatData() {
      await Promise.resolve();

      if (!isCurrent) {
        return;
      }

      setLoadState("loading");
      setLoadedChatDataKey(null);
      setLoadError(null);

      if (!canViewRiskQueue) {
        setSessions([]);
        setConversation(null);
        setMessages([]);
        setLoadState("loaded");
        setLoadedChatDataKey(chatDataKey);
        return;
      }

      try {
        const [nextSessions, nextConversation] = await Promise.all([
          listChatSessions({ demoUserEmail: user.email }),
          activeChatId ? getChatConversation(activeChatId, { demoUserEmail: user.email }) : Promise.resolve(null)
        ]);

        if (!isCurrent) {
          return;
        }

        setSessions(nextSessions);
        setConversation(nextConversation);

        if (!hasInitialSendStarted(activeChatId, initialSendKeyRef.current)) {
          setMessages(nextConversation ? toUIMessages(nextConversation.messages) : []);
        }

        setLoadState("loaded");
        setLoadedChatDataKey(chatDataKey);
      } catch (error: unknown) {
        if (!isCurrent) {
          return;
        }

        setLoadError(getErrorMessage(error));
        setConversation(null);
        setMessages([]);
        setLoadState("error");
        setLoadedChatDataKey(null);
      }
    }

    void loadInitialChatData();

    return () => {
      isCurrent = false;
    };
  }, [activeChatId, canViewRiskQueue, chatDataKey, setMessages, user.email]);

  useEffect(() => {
    const trimmedInitialMessage = pendingInitialMessage?.trim();

    if (
      !activeChatId ||
      !canViewRiskQueue ||
      !trimmedInitialMessage ||
      loadState !== "loaded" ||
      loadedChatDataKey !== chatDataKey ||
      loadError
    ) {
      return;
    }

    if (
      hasPersistedUserMessage(conversation, trimmedInitialMessage) ||
      hasUIUserMessage(messages, trimmedInitialMessage)
    ) {
      return;
    }

    const sendKey = `${activeChatId}:${trimmedInitialMessage}`;

    if (initialSendKeyRef.current === sendKey) {
      return;
    }

    initialSendKeyRef.current = sendKey;
    void sendExistingMessage(trimmedInitialMessage).catch((error: unknown) => {
      setActionError(getErrorMessage(error));
    });
  }, [
    activeChatId,
    canViewRiskQueue,
    conversation,
    chatDataKey,
    loadedChatDataKey,
    loadError,
    loadState,
    messages,
    pendingInitialMessage,
    sendExistingMessage
  ]);

  const handleSubmit = useCallback(
    async (messageText: string) => {
      const trimmedMessage = messageText.trim();

      if (!trimmedMessage || !canViewRiskQueue) {
        return;
      }

      if (props.mode === "new") {
        setIsCreating(true);
        setActionError(null);
        clearError();

        try {
          const session = await createChatSession(trimmedMessage, { demoUserEmail: user.email });
          storePendingInitialChatMessage(session.chatId, trimmedMessage);
          setComposerValue("");
          router.push(createChatPath(session.chatId));
        } catch (error: unknown) {
          setActionError(getErrorMessage(error));
        } finally {
          setIsCreating(false);
        }

        return;
      }

      try {
        await sendExistingMessage(trimmedMessage);
      } catch (error: unknown) {
        setActionError(getErrorMessage(error));
      }
    },
    [canViewRiskQueue, clearError, props.mode, router, sendExistingMessage, user.email]
  );

  const handleStop = useCallback(() => {
    void stop().catch((error: unknown) => {
      setActionError(getErrorMessage(error));
    });
  }, [stop]);

  const handleRemoveContextItem = useCallback(
    async (contextItemId: number) => {
      if (!activeChatId) {
        return;
      }

      setRemovingContextItemId(contextItemId);
      setActionError(null);

      try {
        await deleteChatContextItem(activeChatId, contextItemId, { demoUserEmail: user.email });
        setConversation((currentConversation) =>
          currentConversation
            ? {
                ...currentConversation,
                contextItems: currentConversation.contextItems.filter(
                  (contextItem) => contextItem.contextItemId !== contextItemId
                )
              }
            : currentConversation
        );
      } catch (error: unknown) {
        setActionError(getErrorMessage(error));
      } finally {
        setRemovingContextItemId(null);
      }
    },
    [activeChatId, user.email]
  );

  if (!canViewRiskQueue) {
    return (
      <div className="page-stack chat-page">
        <ChatPageHeader activeChatId={activeChatId} currentTitle={null} userDisplayName={user.displayName} />
        <UsaAlert type="warning" heading="Case assistant unavailable">
          Current demo role cannot view the risk queue. Select a role with risk queue access to use the assistant.
        </UsaAlert>
      </div>
    );
  }

  const isChatBusy = status === "submitted" || status === "streaming";
  const isComposerBusy = isCreating || isChatBusy;
  const isLoading = loadState === "idle" || loadState === "loading";
  const currentTitle = conversation?.session.title?.trim() || null;
  const visibleError = actionError ?? error?.message ?? null;

  return (
    <div className="page-stack chat-page">
      <ChatPageHeader activeChatId={activeChatId} currentTitle={currentTitle} userDisplayName={user.displayName} />

      {loadError ? (
        <UsaAlert type="error" heading="Unable to load chat">
          {loadError}
        </UsaAlert>
      ) : null}

      {visibleError ? (
        <UsaAlert type="error" heading="Assistant request failed" slim>
          {visibleError}
        </UsaAlert>
      ) : null}

      <div className="chat-layout">
        <ChatHistoryPanel activeChatId={activeChatId} isLoading={isLoading} sessions={sessions} />

        <section aria-label="Case assistant workspace" className="panel chat-workspace">
          <div className="chat-workspace__summary">
            <strong>{currentTitle ?? (activeChatId ? `Chat ${activeChatId.slice(0, 8)}` : "New chat")}</strong>
            <span className="status-text">{getStatusText(status, isCreating, isLoading)}</span>
          </div>

          <ChatMessageList messages={messages} status={status} />
          <ChatComposer
            allowWebSearch={allowWebSearch}
            canStop={isChatBusy}
            disabled={isLoading || Boolean(loadError)}
            isBusy={isComposerBusy}
            onAllowWebSearchChange={setAllowWebSearch}
            onStop={handleStop}
            onSubmit={handleSubmit}
            onSuggestionSelect={setComposerValue}
            onValueChange={setComposerValue}
            suggestions={suggestions}
            value={composerValue}
          />
        </section>

        <ChatContextPanel
          contextItems={conversation?.contextItems ?? []}
          onRemoveContextItem={activeChatId ? handleRemoveContextItem : undefined}
          removingContextItemId={removingContextItemId}
          toolCalls={conversation?.toolCalls ?? []}
        />
      </div>
    </div>
  );
}

function ChatPageHeader({
  activeChatId,
  currentTitle,
  userDisplayName
}: {
  activeChatId: string | null;
  currentTitle: string | null;
  userDisplayName: string;
}) {
  return (
    <PageHeader
      eyebrow="Read-only case assistant"
      title="Case Assistant"
      description="Ask operational questions about synthetic case records, risk queue patterns, provider risk, and case aging."
    >
      <div className="page-header-actions chat-page__header-actions">
        <span className="status-text">Demo user: {userDisplayName}</span>
        {activeChatId ? (
          <span className="status-text">Active chat: {currentTitle ?? activeChatId.slice(0, 8)}</span>
        ) : (
          <span className="status-text">Start a new assistant chat.</span>
        )}
      </div>
    </PageHeader>
  );
}

function createTransport(activeChatId: string | null, demoUserEmail: string) {
  const api = activeChatId ? `/api/chat/${encodeURIComponent(activeChatId)}` : "/api/chat/new";

  return new DefaultChatTransport<UIMessage>({
    api,
    prepareSendMessagesRequest: ({ body, messages }) => {
      const requestDemoUserEmail = getRequestDemoUserEmail(body, demoUserEmail);
      const headers = new Headers(getChatAuthHeaders());
      headers.set("X-Demo-User", requestDemoUserEmail);

      return {
        api,
        headers,
        body: {
          messages,
          demoUserEmail: requestDemoUserEmail,
          allowWebSearch: body?.allowWebSearch === true
        }
      };
    }
  });
}

function getRequestDemoUserEmail(body: Record<string, unknown> | undefined, fallbackEmail: string) {
  const candidate = typeof body?.demoUserEmail === "string" ? body.demoUserEmail.trim() : fallbackEmail;
  return candidate.length > 0 ? candidate : fallbackDemoUserEmail;
}

function toUIMessages(messages: ChatMessage[]): UIMessage[] {
  return messages.flatMap((message) => {
    const role = toUIRole(message.role);

    if (!role) {
      return [];
    }

    return [
      {
        id: message.clientMessageId ?? `persisted-${message.messageId}`,
        role,
        parts: [
          {
            type: "text",
            text: message.content
          }
        ]
      } satisfies UIMessage
    ];
  });
}

function toUIRole(role: ChatMessage["role"]): UIMessage["role"] | null {
  if (role === "assistant") {
    return "assistant";
  }

  if (role === "user" || role === "system") {
    return role;
  }

  return null;
}

function getUIMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function hasPersistedUserMessage(conversation: ChatConversation | null, text: string) {
  const normalizedText = normalizeMessageText(text);

  return (
    conversation?.messages.some(
      (message) => message.role === "user" && normalizeMessageText(message.content) === normalizedText
    ) ?? false
  );
}

function hasUIUserMessage(messages: UIMessage[], text: string) {
  const normalizedText = normalizeMessageText(text);

  return messages.some(
    (message) => message.role === "user" && normalizeMessageText(getUIMessageText(message)) === normalizedText
  );
}

function hasInitialSendStarted(activeChatId: string | null, sendKey: string | null) {
  return Boolean(activeChatId && sendKey?.startsWith(`${activeChatId}:`));
}

function normalizeMessageText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getStatusText(status: ChatStatus, isCreating: boolean, isLoading: boolean) {
  if (isCreating) {
    return "Creating chat session.";
  }

  if (isLoading) {
    return "Loading saved chat data.";
  }

  if (status === "submitted") {
    return "Submitting request.";
  }

  if (status === "streaming") {
    return "Assistant is responding.";
  }

  if (status === "error") {
    return "Assistant request needs attention.";
  }

  return "Ready for a read-only case question.";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected chat error.";
}

function createClientSuggestionSeed() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
