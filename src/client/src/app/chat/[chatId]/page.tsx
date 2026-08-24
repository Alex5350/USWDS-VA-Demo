import type { Metadata } from "next";
import { Suspense } from "react";

import { ChatView } from "@/components/chat/ChatView";

type ChatPageProps = {
  params: Promise<{
    chatId: string;
  }>;
};

export async function generateMetadata({ params }: ChatPageProps): Promise<Metadata> {
  const { chatId } = await params;
  return {
    title: `Case Assistant ${chatId.slice(0, 8)}`
  };
}

export default async function ExistingChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;

  return (
    <Suspense fallback={<p className="status-text">Loading case assistant.</p>}>
      <ChatView mode="existing" chatId={chatId} />
    </Suspense>
  );
}
