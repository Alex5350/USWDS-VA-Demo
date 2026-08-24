import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatView } from "@/components/chat/ChatView";

export const metadata: Metadata = {
  title: "Case Assistant"
};

export default function NewChatPage() {
  return (
    <Suspense fallback={<p className="status-text">Loading case assistant.</p>}>
      <ChatView mode="new" />
    </Suspense>
  );
}
