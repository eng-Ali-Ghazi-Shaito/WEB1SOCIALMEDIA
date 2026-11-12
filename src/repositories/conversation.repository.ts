import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ConversationCursor, ConversationSummary } from "@/types/conversation.types";
import { toRepositoryError } from "@/util/exceptions/toRepositoryError";

type ConversationRow = Omit<ConversationSummary, "lastMessageAt"> & { lastMessageAt: Date };

export class ConversationRepository {
  constructor(private readonly db: Pick<PrismaClient, "$queryRaw"> = prisma) {}

  async findPage(
    viewerId: string,
    cursor: ConversationCursor | undefined,
    take: number,
  ): Promise<ConversationRow[]> {
    // Bind an explicit offset because the adapter serializes Date parameters without one.
    const beforeCursor = cursor
      ? Prisma.sql`WHERE (inbox.last_message_at, inbox.id) < (${cursor.lastMessageAt.toISOString()}::timestamptz, ${cursor.id}::uuid)`
      : Prisma.empty;

    try {
      return await this.db.$queryRaw<ConversationRow[]>`
        WITH inbox AS (
          SELECT id, user_b_id AS other_user_id, user_a_last_read_at AS viewer_last_read_at, last_message_at
          FROM conversations
          WHERE user_a_id = ${viewerId}::uuid
          UNION ALL
          SELECT id, user_a_id AS other_user_id, user_b_last_read_at AS viewer_last_read_at, last_message_at
          FROM conversations
          WHERE user_b_id = ${viewerId}::uuid
        ),
        page AS (
          SELECT inbox.id, inbox.viewer_last_read_at, inbox.last_message_at,
                 other_user.id AS other_user_id, other_user.username, other_user.full_name, other_user.avatar_url
          FROM inbox
          JOIN users AS other_user ON other_user.id = inbox.other_user_id
            AND other_user.email_verified_at IS NOT NULL
          ${beforeCursor}
          ORDER BY inbox.last_message_at DESC, inbox.id DESC
          LIMIT ${take}
        )
        SELECT
          page.id,
          page.last_message_at AT TIME ZONE 'UTC' AS "lastMessageAt",
          jsonb_build_object(
            'id', page.other_user_id,
            'username', page.username,
            'fullName', page.full_name,
            'avatarUrl', page.avatar_url
          ) AS "otherUser",
          CASE WHEN latest.id IS NOT NULL THEN jsonb_build_object(
            'id', latest.id,
            'senderId', latest.sender_id,
            'body', latest.body,
            'createdAt', latest.created_at
          ) END AS "lastMessage",
          EXISTS (
            SELECT 1
            FROM messages AS incoming
            WHERE incoming.conversation_id = page.id AND incoming.sender_id = page.other_user_id
              AND (page.viewer_last_read_at IS NULL OR incoming.created_at > page.viewer_last_read_at)
          ) AS unread
        FROM page
        LEFT JOIN LATERAL (
          SELECT id, sender_id, body, created_at
          FROM messages
          WHERE conversation_id = page.id
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        ) AS latest ON true
        ORDER BY page.last_message_at DESC, page.id DESC
      `;
    } catch (error) {
      throw toRepositoryError(error);
    }
  }
}

export const conversationRepository = new ConversationRepository();
