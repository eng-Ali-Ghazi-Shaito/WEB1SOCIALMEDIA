import type { z } from "zod";

import type { conversationQuerySchema } from "@/validations/conversation.schema";

export type ConversationQuery = z.infer<typeof conversationQuerySchema>;
export type ConversationCursor = NonNullable<ConversationQuery["cursor"]>;

export interface ConversationSummary {
  id: string;
  otherUser: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    senderId: string;
    body: string;
    createdAt: string;
  } | null;
  lastMessageAt: string;
  unread: boolean;
}

export interface ConversationPage {
  conversations: ConversationSummary[];
  nextCursor: string | null;
}
