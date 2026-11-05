"use client";

import { useParams } from "next/navigation";
import { ChatScreen } from "@/components/chat-screen";

export function ConversationRoute() {
  const { id } = useParams<{ id: string }>();
  // Keyed by id so the typing state and draft never leak into the next chat.
  return <ChatScreen conversationId={id} key={id} />;
}
