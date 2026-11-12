import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toRepositoryError } from "@/util/exceptions/toRepositoryError";

class PostLikeWriter {
  constructor(private readonly db: Prisma.TransactionClient) {}

  async lockPostAuthor(postId: string): Promise<string | null> {
    // Serialize changes to this post and make deletion wait for the whole transaction.
    const [post] = await this.db.$queryRaw<{ authorId: string }[]>`
      SELECT author_id AS "authorId"
      FROM posts
      WHERE id = ${postId}::uuid
      FOR NO KEY UPDATE
    `;
    return post?.authorId ?? null;
  }

  async setLiked(postId: string, userId: string, liked: boolean): Promise<boolean> {
    const result = liked
      ? await this.db.like.createMany({ data: { postId, userId }, skipDuplicates: true })
      : await this.db.like.deleteMany({ where: { postId, userId } });
    return result.count === 1;
  }

  async recordChange(userId: string, limit: number, windowMinutes: number): Promise<boolean> {
    // The upsert serializes each user's quota across posts. Keeping the latest limit
    // timestamps bounds storage, and the oldest of those timestamps gates the next slot.
    const count = await this.db.$executeRaw`
      INSERT INTO post_like_rate_limits AS quota (user_id, change_times)
      VALUES (${userId}::uuid, ARRAY[clock_timestamp()])
      ON CONFLICT (user_id) DO UPDATE
      SET change_times = (array_append(quota.change_times, clock_timestamp()))[
        GREATEST(cardinality(quota.change_times) - ${limit}::integer + 2, 1):
      ]
      WHERE cardinality(quota.change_times) < ${limit}::integer
        OR quota.change_times[cardinality(quota.change_times) - ${limit}::integer + 1]
          <= clock_timestamp() - (${windowMinutes}::integer * INTERVAL '1 minute')
    `;
    return count === 1;
  }

  async setNotification(postId: string, recipientId: string, actorId: string, liked: boolean): Promise<void> {
    const notification = { postId, recipientId, actorId, type: "LIKE" } as const;
    if (liked) {
      await this.db.notification.createMany({ data: notification, skipDuplicates: true });
    } else {
      await this.db.notification.deleteMany({ where: notification });
    }
  }

  countLikes(postId: string): Promise<number> {
    return this.db.like.count({ where: { postId } });
  }
}

type PostLikeOperations = Pick<PostLikeWriter,
  "lockPostAuthor" | "setLiked" | "recordChange" | "setNotification" | "countLikes"
>;

export class PostLikeRepository {
  constructor(private readonly db: Pick<PrismaClient, "$transaction"> = prisma) {}

  async transaction<T>(work: (likes: PostLikeOperations) => Promise<T>): Promise<T> {
    try {
      return await this.db.$transaction((tx) => work(new PostLikeWriter(tx)), {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      });
    } catch (error) {
      throw toRepositoryError(error);
    }
  }
}

export const postLikeRepository = new PostLikeRepository();
