"use client";

import Link from "next/link";

import type { ChatSession } from "@/lib/chat-client";
import { formatDate } from "@/lib/formatters";

type ChatHistoryPanelProps = {
  sessions: ChatSession[];
  activeChatId?: string | null;
  isLoading?: boolean;
};

export function ChatHistoryPanel({ sessions, activeChatId, isLoading = false }: ChatHistoryPanelProps) {
  return (
    <aside aria-labelledby="chat-history-heading" className="panel chat-history-panel">
      <div className="section-header-row chat-history-panel__header">
        <div>
          <h2 id="chat-history-heading">Chat History</h2>
          <p className="status-text">Saved conversations for the current demo user.</p>
        </div>
        <Link className="usa-button chat-history-panel__new-link" href="/chat/new">
          New chat
        </Link>
      </div>

      {isLoading ? <p className="status-text chat-history-panel__loading">Loading chats.</p> : null}

      {sessions.length === 0 && !isLoading ? (
        <p className="status-text chat-history-panel__empty">No saved chats yet.</p>
      ) : (
        <ol className="chat-history-panel__list">
          {sessions.map((session) => {
            const title = session.title?.trim() || "New chat";
            const lastActivity = session.lastMessageAt ?? session.createdAt;

            return (
              <li className="chat-history-panel__item" key={session.chatId}>
                <Link
                  aria-current={session.chatId === activeChatId ? "page" : undefined}
                  className="chat-history-panel__link"
                  href={`/chat/${session.chatId}`}
                >
                  <span className="chat-history-panel__title">{title}</span>
                  <span className="chat-history-panel__date">{formatDate(lastActivity)}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
