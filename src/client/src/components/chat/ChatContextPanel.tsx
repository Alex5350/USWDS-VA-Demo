"use client";

import { UsaButton } from "@/components/uswds/UsaButton";
import type { ChatContextItem, ChatToolCall } from "@/lib/chat-client";
import { formatDate } from "@/lib/formatters";

type ChatContextPanelProps = {
  contextItems: ChatContextItem[];
  toolCalls: ChatToolCall[];
  removingContextItemId?: number | null;
  onRemoveContextItem?: (contextItemId: number) => void | Promise<void>;
};

const previewLength = 360;

export function ChatContextPanel({
  contextItems,
  toolCalls,
  removingContextItemId = null,
  onRemoveContextItem
}: ChatContextPanelProps) {
  return (
    <aside aria-labelledby="chat-context-heading" className="panel chat-context-panel">
      <div className="chat-context-panel__header">
        <h2 id="chat-context-heading">Case Context</h2>
        <p className="status-text">Pinned case references and recent read-only tool activity.</p>
      </div>

      <section aria-labelledby="chat-pinned-context-heading" className="chat-context-panel__section">
        <h3 id="chat-pinned-context-heading">Pinned Context</h3>
        {contextItems.length === 0 ? (
          <p className="status-text chat-context-panel__empty">No pinned context for this chat.</p>
        ) : (
          <ol className="chat-context-panel__list">
            {contextItems.map((item) => (
              <li className="chat-context-panel__item" key={item.contextItemId}>
                <div className="chat-context-panel__item-main">
                  <strong>{item.label?.trim() || formatContextLabel(item)}</strong>
                  <span className="status-text">
                    {item.contextType} | {formatDate(item.createdAt)}
                  </span>
                  {item.snapshotJson ? (
                    <p className="chat-context-panel__preview">{truncate(item.snapshotJson)}</p>
                  ) : null}
                </div>
                {onRemoveContextItem ? (
                  <UsaButton
                    className="chat-context-panel__remove"
                    disabled={removingContextItemId === item.contextItemId}
                    onClick={() => void onRemoveContextItem(item.contextItemId)}
                    type="button"
                    variant="unstyled"
                  >
                    {removingContextItemId === item.contextItemId ? "Removing" : "Remove"}
                  </UsaButton>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="chat-tool-calls-heading" className="chat-context-panel__section">
        <h3 id="chat-tool-calls-heading">Recent Tool Calls</h3>
        {toolCalls.length === 0 ? (
          <p className="status-text chat-context-panel__empty">No tool calls recorded yet.</p>
        ) : (
          <ol className="chat-context-panel__list">
            {toolCalls.map((toolCall) => (
              <li className="chat-context-panel__tool-call" key={toolCall.toolCallId}>
                <div className="chat-context-panel__tool-call-header">
                  <strong>{formatToolName(toolCall.toolName)}</strong>
                  <span className={toolCall.succeeded ? "chat-context-panel__tool-success" : "chat-context-panel__tool-error"}>
                    {toolCall.succeeded ? "Succeeded" : "Failed"}
                  </span>
                </div>
                <dl className="chat-context-panel__tool-meta">
                  <div>
                    <dt>Surface</dt>
                    <dd>{toolCall.allowedSurface}</dd>
                  </div>
                  <div>
                    <dt>Rows</dt>
                    <dd>{toolCall.rowCount ?? "Not recorded"}</dd>
                  </div>
                  <div>
                    <dt>Duration</dt>
                    <dd>{toolCall.durationMs === null ? "Not recorded" : `${toolCall.durationMs} ms`}</dd>
                  </div>
                </dl>
                <p className="status-text chat-context-panel__tool-date">{formatDate(toolCall.createdAt)}</p>
                {toolCall.resultSummary ? (
                  <p className="chat-context-panel__preview">{toolCall.resultSummary}</p>
                ) : null}
                {toolCall.errorMessage ? (
                  <p className="chat-context-panel__error-message">{toolCall.errorMessage}</p>
                ) : null}
                <details className="chat-context-panel__arguments">
                  <summary>Arguments</summary>
                  <pre>{truncate(toolCall.argumentsJson)}</pre>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}

function formatContextLabel(item: ChatContextItem) {
  const entity = item.entityId ? `${item.entityType} ${item.entityId}` : item.entityType;
  return `${item.contextType} | ${entity}`;
}

function formatToolName(value: string) {
  return value.replace(/[-_]/g, " ");
}

function truncate(value: string) {
  return value.length > previewLength ? `${value.slice(0, previewLength)}...` : value;
}
