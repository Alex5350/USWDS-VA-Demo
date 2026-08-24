"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { UsaAlert } from "@/components/uswds/UsaAlert";
import { UsaButton } from "@/components/uswds/UsaButton";
import { UsaPagination } from "@/components/uswds/UsaPagination";
import { UsaTable } from "@/components/uswds/UsaTable";
import { deleteChatSession, listChatSessions, type ChatSession } from "@/lib/chat-client";
import { getChatDeleteDialogState } from "@/lib/chat-history-delete";
import {
  chatHistoryPageSizeOptions,
  getChatHistoryPage,
  type ChatHistoryRow
} from "@/lib/chat-history-table";
import { useDemoUser } from "@/lib/demo-auth";
import { formatDate } from "@/lib/formatters";

type ChatHistoryLoadState = "idle" | "loading" | "loaded" | "error";

export function ChatHistoryPageView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, hasPermission } = useDemoUser();
  const canViewRiskQueue = hasPermission("CanViewRiskQueue");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loadState, setLoadState] = useState<ChatHistoryLoadState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<ChatHistoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const page = getQueryValue(searchParams, "page");
  const pageSize = getQueryValue(searchParams, "pageSize");
  const historyPage = useMemo(() => getChatHistoryPage(sessions, { page, pageSize }), [page, pageSize, sessions]);
  const isLoading = loadState === "idle" || loadState === "loading";
  const deleteDialogState = getChatDeleteDialogState({
    pendingTitle: pendingDeleteRow?.title ?? null,
    isDeleting
  });

  useEffect(() => {
    let isCurrent = true;

    async function loadSessions() {
      await Promise.resolve();

      if (!isCurrent) {
        return;
      }

      if (!canViewRiskQueue) {
        setSessions([]);
        setLoadState("loaded");
        setLoadError(null);
        return;
      }

      setLoadState("loading");
      setLoadError(null);

      try {
        const nextSessions = await listChatSessions({ demoUserEmail: user.email });

        if (!isCurrent) {
          return;
        }

        setSessions(nextSessions);
        setLoadState("loaded");
      } catch (error: unknown) {
        if (!isCurrent) {
          return;
        }

        setSessions([]);
        setLoadError(getErrorMessage(error));
        setLoadState("error");
      }
    }

    void loadSessions();

    return () => {
      isCurrent = false;
    };
  }, [canViewRiskQueue, user.email]);

  function openDeleteDialog(row: ChatHistoryRow) {
    setDeleteError(null);
    setPendingDeleteRow(row);
  }

  function cancelDeleteDialog() {
    if (isDeleting) {
      return;
    }

    setPendingDeleteRow(null);
    setDeleteError(null);
  }

  async function handleDeleteConfirmed() {
    if (!pendingDeleteRow) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteChatSession(pendingDeleteRow.chatId, { demoUserEmail: user.email });
      setSessions((currentSessions) => currentSessions.filter((session) => session.chatId !== pendingDeleteRow.chatId));
      setPendingDeleteRow(null);
    } catch (error: unknown) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  if (!canViewRiskQueue) {
    return (
      <div className="page-stack chat-history-page">
        <ChatHistoryHeader />
        <UsaAlert type="warning" heading="Chat history unavailable">
          Current demo role cannot view the risk queue. Select a role with risk queue access to view assistant history.
        </UsaAlert>
      </div>
    );
  }

  return (
    <div className="page-stack chat-history-page">
      <ChatHistoryHeader userDisplayName={user.displayName} />

      {loadError ? (
        <UsaAlert type="error" heading="Unable to load chat history">
          {loadError}
        </UsaAlert>
      ) : null}

      {deleteError ? (
        <UsaAlert type="error" heading="Unable to delete chat">
          {deleteError}
        </UsaAlert>
      ) : null}

      <section className="panel chat-history-table-panel" aria-labelledby="chat-history-table-heading">
        <div className="section-header-row chat-history-table-panel__header">
          <div>
            <h2 id="chat-history-table-heading">Saved conversations</h2>
            <p className="status-text">
              {isLoading
                ? "Loading saved assistant chats."
                : `${historyPage.paging.totalItems} saved ${historyPage.paging.totalItems === 1 ? "chat" : "chats"}.`}
            </p>
          </div>
          <Link className="usa-button" href="/chat/new">
            New chat
          </Link>
        </div>

        {isLoading ? (
          <p className="status-text chat-history-table-panel__loading">Loading chat history.</p>
        ) : historyPage.rows.length > 0 ? (
          <>
            <UsaTable
              caption="Saved case assistant conversations"
              columns={[
                {
                  key: "title",
                  header: "Conversation",
                  render: (row) => (
                    <Link className="chat-history-table__title-link" href={`/chat/${row.chatId}`}>
                      {row.title}
                    </Link>
                  )
                },
                {
                  key: "lastActivityAt",
                  header: "Last activity",
                  render: (row) => formatDate(row.lastActivityAt)
                },
                {
                  key: "createdAt",
                  header: "Created",
                  render: (row) => formatDate(row.createdAt)
                },
                {
                  key: "shortChatId",
                  header: "Chat ID",
                  render: (row) => <code>{row.shortChatId}</code>
                },
                {
                  key: "actions",
                  header: "Actions",
                  render: (row) => (
                    <div className="action-row chat-history-table__actions">
                      <Link className="usa-button usa-button--outline chat-history-table__open-link" href={`/chat/${row.chatId}`}>
                        Open
                      </Link>
                      <UsaButton
                        className="chat-history-table__delete-button"
                        disabled={isDeleting}
                        type="button"
                        variant="secondary"
                        onClick={() => openDeleteDialog(row)}
                      >
                        Delete
                      </UsaButton>
                    </div>
                  )
                }
              ]}
              getRowKey={(row) => row.chatId}
              rows={historyPage.rows}
            />

            <UsaPagination
              ariaLabel="Chat history pagination"
              getPageHref={(nextPage) => createHistoryHref(pathname, searchParams, { page: nextPage })}
              onPageSizeChange={(nextPageSize) => {
                router.push(createHistoryHref(pathname, searchParams, { page: 1, pageSize: nextPageSize }));
              }}
              page={historyPage.paging.page}
              pageSize={historyPage.paging.pageSize}
              pageSizeOptions={[...chatHistoryPageSizeOptions]}
              scroll={false}
              totalItems={historyPage.paging.totalItems}
              totalPages={historyPage.paging.totalPages}
            />
          </>
        ) : (
          <div className="empty-state chat-history-table-panel__empty">
            <h3>No saved chats yet</h3>
            <p>Start a new case assistant chat to save the conversation for this demo user.</p>
            <Link className="usa-button" href="/chat/new">
              New chat
            </Link>
          </div>
        )}
      </section>

      {deleteDialogState && pendingDeleteRow ? (
        <div className="modal-scrim" role="presentation">
          <section
            aria-describedby="delete-chat-dialog-description"
            aria-labelledby="delete-chat-dialog-heading"
            aria-modal="true"
            className="confirm-dialog"
            role="dialog"
          >
            <div className="confirm-dialog__header">
              <p className="page-eyebrow">Delete saved conversation</p>
              <h2 id="delete-chat-dialog-heading">{deleteDialogState.heading}</h2>
            </div>
            <p id="delete-chat-dialog-description">{deleteDialogState.body}</p>
            <dl className="confirm-dialog__facts">
              <div>
                <dt>Chat ID</dt>
                <dd>{pendingDeleteRow.shortChatId}</dd>
              </div>
              <div>
                <dt>Last activity</dt>
                <dd>{formatDate(pendingDeleteRow.lastActivityAt)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(pendingDeleteRow.createdAt)}</dd>
              </div>
            </dl>
            <div className="action-row confirm-dialog__actions">
              <UsaButton
                disabled={deleteDialogState.controlsDisabled}
                type="button"
                variant="secondary"
                onClick={handleDeleteConfirmed}
              >
                {deleteDialogState.confirmLabel}
              </UsaButton>
              <UsaButton
                disabled={deleteDialogState.controlsDisabled}
                type="button"
                variant="outline"
                onClick={cancelDeleteDialog}
              >
                {deleteDialogState.cancelLabel}
              </UsaButton>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ChatHistoryHeader({ userDisplayName }: { userDisplayName?: string }) {
  return (
    <PageHeader
      eyebrow="Read-only case assistant"
      title="Chat History"
      description="Review saved case assistant conversations for the current demo user."
    >
      <div className="page-header-actions chat-page__header-actions">
        {userDisplayName ? <span className="status-text">Demo user: {userDisplayName}</span> : null}
        <Link className="usa-button usa-button--outline" href="/chat/new">
          Back to case assistant
        </Link>
      </div>
    </PageHeader>
  );
}

function getQueryValue(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key);
}

function createHistoryHref(
  pathname: string,
  currentParams: URLSearchParams,
  updates: {
    page?: number;
    pageSize?: number;
  }
) {
  const params = new URLSearchParams(currentParams.toString());

  if (updates.page !== undefined) {
    params.set("page", String(updates.page));
  }

  if (updates.pageSize !== undefined) {
    params.set("pageSize", String(updates.pageSize));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected chat history error.";
}
