import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Case Assistant"
};

export default function ChatPage() {
  redirect("/chat/new");
}
