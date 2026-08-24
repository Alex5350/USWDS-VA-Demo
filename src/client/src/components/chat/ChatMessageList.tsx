"use client";

import type { UIMessage } from "ai";

import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

type ChatMessageListProps = {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
};

type MessagePart = UIMessage["parts"][number];

const previewLength = 520;

export function ChatMessageList({ messages, status }: ChatMessageListProps) {
  const isWaiting = status === "submitted" || status === "streaming";

  return (
    <section
      aria-busy={isWaiting}
      aria-labelledby="case-assistant-messages-heading"
      className="chat-message-list"
    >
      <div className="section-header-row chat-message-list__header">
        <div>
          <h2 id="case-assistant-messages-heading">Conversation</h2>
          <p className="status-text">Read-only answers use synthetic case, queue, provider, and report data.</p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="chat-message-list__empty">
          <p>Ask a case question to start a read-only assistant conversation.</p>
        </div>
      ) : (
        <ol className="chat-message-list__items">
          {messages.map((message) => (
            <li className={`chat-message chat-message--${message.role}`} key={message.id}>
              <article className="chat-message__card">
                <header className="chat-message__header">
                  <h3>{getRoleLabel(message.role)}</h3>
                </header>
                <div className="chat-message__body">{renderMessageParts(message)}</div>
              </article>
            </li>
          ))}
        </ol>
      )}

      {isWaiting ? (
        <p aria-live="polite" className="status-text chat-message-list__status" role="status">
          Assistant response in progress.
        </p>
      ) : null}
    </section>
  );
}

function renderMessageParts(message: UIMessage) {
  const renderedParts = message.parts
    .map((part, index) => renderMessagePart(part, `${message.id}-${index}`))
    .filter(Boolean);

  return renderedParts.length > 0 ? renderedParts : <p className="status-text">No displayable content recorded.</p>;
}

function renderMessagePart(part: MessagePart, key: string) {
  if (part.type === "text") {
    return part.text.trim().length > 0 ? <ChatMarkdown key={key} text={part.text} /> : null;
  }

  if (isToolPart(part)) {
    return <ToolPartSummary key={key} part={part} />;
  }

  if (part.type === "source-url") {
    return (
      <p className="chat-message__source" key={key}>
        Source:{" "}
        <a href={part.url} rel="noreferrer" target="_blank">
          {part.title ?? part.url}
        </a>
      </p>
    );
  }

  if (part.type === "source-document") {
    return (
      <p className="chat-message__source" key={key}>
        Source document: {part.title}
      </p>
    );
  }

  if (part.type === "file") {
    return (
      <p className="chat-message__attachment" key={key}>
        Attachment: {part.filename ?? part.mediaType}
      </p>
    );
  }

  return null;
}

function ToolPartSummary({ part }: { part: MessagePart }) {
  const record = part as Record<string, unknown>;
  const toolName = getToolName(part);
  const state = typeof record.state === "string" ? record.state : "received";
  const preview = getToolPreview(record);

  return (
    <details className="chat-message__tool">
      <summary>
        <span className="chat-message__tool-label">Tool lookup</span>
        <span className="chat-message__tool-name">{formatToolName(toolName)}</span>
        <span className="chat-message__tool-state">{formatState(state)}</span>
      </summary>
      {preview ? <pre className="chat-message__tool-preview">{preview}</pre> : <p>Tool activity recorded.</p>}
    </details>
  );
}

function isToolPart(part: MessagePart) {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

function getToolName(part: MessagePart) {
  if (part.type === "dynamic-tool") {
    return part.toolName;
  }

  return part.type.startsWith("tool-") ? part.type.slice("tool-".length) : "tool";
}

function getToolPreview(record: Record<string, unknown>) {
  if (typeof record.errorText === "string" && record.errorText.trim().length > 0) {
    return truncate(record.errorText);
  }

  if ("output" in record && record.output !== undefined) {
    return stringifyPreview(record.output);
  }

  if ("input" in record && record.input !== undefined) {
    return `Input: ${stringifyPreview(record.input)}`;
  }

  return "";
}

function stringifyPreview(value: unknown) {
  if (typeof value === "string") {
    return truncate(value);
  }

  try {
    return truncate(JSON.stringify(value, null, 2));
  } catch {
    return "Details received.";
  }
}

function truncate(value: string) {
  return value.length > previewLength ? `${value.slice(0, previewLength)}...` : value;
}

function getRoleLabel(role: UIMessage["role"]) {
  if (role === "assistant") {
    return "Assistant";
  }

  if (role === "system") {
    return "System";
  }

  return "Analyst";
}

function formatToolName(value: string) {
  return value.replace(/[-_]/g, " ");
}

function formatState(value: string) {
  return value.replace(/-/g, " ");
}
