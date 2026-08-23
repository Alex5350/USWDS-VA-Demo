import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatHistoryPageView } from "@/components/chat/ChatHistoryPageView";

export const metadata: Metadata = {
  title: "Chat History"
};

export default function ChatHistoryPage() {
  return (
    <Suspense fallback={<p className="status-text">Loading chat history.</p>}>
      <ChatHistoryPageView />
    </Suspense>
  );
}
