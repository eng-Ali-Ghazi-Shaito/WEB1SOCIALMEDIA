import { CONVERSATION_PAGE_SIZE } from "@/config/constants";
import { conversationRepository, type ConversationRepository } from "@/repositories/conversation.repository";
import type { ConversationPage, ConversationQuery } from "@/types/conversation.types";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { ServiceUnavailableException } from "@/util/exceptions/http/ServiceUnavailableException";

export class ConversationService {
  constructor(
    private readonly conversations: Pick<ConversationRepository, "findPage"> = conversationRepository,
  ) {}

  async listConversations(viewerId: string, query: ConversationQuery): Promise<ConversationPage> {
    try {
      const rows = await this.conversations.findPage(viewerId, query.cursor, CONVERSATION_PAGE_SIZE + 1);
      const conversations = rows.slice(0, CONVERSATION_PAGE_SIZE).map((row) => ({
        ...row,
        lastMessageAt: row.lastMessageAt.toISOString(),
        lastMessage: row.lastMessage && {
          ...row.lastMessage,
          createdAt: new Date(row.lastMessage.createdAt).toISOString(),
        },
      }));

      // The inbox order follows the last message rather than the time a chat was created.
      const last = conversations.at(-1);
      const nextCursor = rows.length > CONVERSATION_PAGE_SIZE && last
        ? `${last.lastMessageAt}_${last.id}`
        : null;

      return { conversations, nextCursor };
    } catch (error) {
      if (error instanceof DatabaseConnectionException) {
        throw new ServiceUnavailableException("Database temporarily unavailable");
      }
      throw error;
    }
  }
}

export const conversationService = new ConversationService();
