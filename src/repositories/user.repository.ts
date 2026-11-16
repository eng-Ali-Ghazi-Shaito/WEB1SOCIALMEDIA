import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toRepositoryError } from "@/util/exceptions/toRepositoryError";

const credentialsSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  passwordHash: true,
  emailVerifiedAt: true,
} satisfies Prisma.UserSelect;

const myAccountSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  bio: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type MyAccountRow = Prisma.UserGetPayload<{ select: typeof myAccountSelect }> & {
  unreadNotifications: number;
  unreadConversations: number;
};

export type UserCredentials = Prisma.UserGetPayload<{ select: typeof credentialsSelect }>;

export class UserRepository {
  constructor(private readonly db = prisma) {}

  async findByIdentifier(identifier: string): Promise<UserCredentials | null> {
    // Usernames cannot contain "@" (database CHECK), so this never picks the wrong column.
    const where = identifier.includes("@") ? { email: identifier } : { username: identifier };
    try {
      return await this.db.user.findUnique({ where, select: credentialsSelect });
    } catch (error) {
      throw toRepositoryError(error);
    }
  }
  async findMe(userId: string): Promise<MyAccountRow | null> {
    try {
      const user = await this.db.user.findUnique({ where: { id: userId }, select: myAccountSelect });
      // A valid token for a deleted account: the service turns this null into a 401.
      if (!user) return null;

      // The two counts are independent, so they run at the same time instead of one after the other.
      const [unreadNotifications, unreadConversations] = await Promise.all([
        this.countUnreadNotifications(userId),
        this.countUnreadConversations(userId),
      ]);

      return { ...user, unreadNotifications, unreadConversations };
    } catch (error) {
      throw toRepositoryError(error);
    }
  }

  private countUnreadNotifications(userId: string): Promise<number> {
    return this.db.notification.count({ where: { recipientId: userId, readAt: null } });
  }

  // Unread = the other person wrote after my own last read time, the same rule API #15 uses.
  // It compares two columns of the same row, which the Prisma query API cannot express, so it is SQL.
  // COUNT(*)::int because PostgreSQL counts as bigint, which arrives in Node as a BigInt JSON cannot hold.
  private async countUnreadConversations(userId: string): Promise<number> {
    const [row] = await this.db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM conversations AS c
      WHERE (c.user_a_id = ${userId}::uuid OR c.user_b_id = ${userId}::uuid)
        AND EXISTS (
          SELECT 1
          FROM messages AS m
          WHERE m.conversation_id = c.id
            AND m.sender_id <> ${userId}::uuid
            AND (
              CASE WHEN c.user_a_id = ${userId}::uuid THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END IS NULL
              OR m.created_at > CASE WHEN c.user_a_id = ${userId}::uuid THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END
            )
        )
    `;
    return row?.count ?? 0;
  }
}

export const userRepository = new UserRepository();
