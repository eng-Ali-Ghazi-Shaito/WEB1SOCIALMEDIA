import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { FeedCursor, FeedPost } from "@/types/feed.types";
import { toRepositoryError } from "@/util/exceptions/toRepositoryError";

type FeedPostRow = Omit<FeedPost, "createdAt"> & { createdAt: Date };

export class FeedRepository {
  constructor(private readonly db: Pick<PrismaClient, "$queryRaw"> = prisma) {}

  async findPage(viewerId: string, cursor: FeedCursor | undefined, take: number): Promise<FeedPostRow[]> {
    const beforeCursor = cursor
      ? Prisma.sql`AND (created_at, id) < (${cursor.createdAt}::timestamptz, ${cursor.id}::uuid)`
      : Prisma.empty;

    try {
      // The per-author limit lets PostgreSQL use the posts_profile_and_feed index.
      return await this.db.$queryRaw<FeedPostRow[]>`
        WITH feed_authors AS (
          SELECT ${viewerId}::uuid AS id
          UNION
          SELECT following_id FROM follows WHERE follower_id = ${viewerId}::uuid
        ),
        feed_page AS (
          SELECT post.id, post.author_id, post.image_url, post.caption, post.created_at
          FROM feed_authors
          CROSS JOIN LATERAL (
            SELECT id, author_id, image_url, caption, created_at
            FROM posts
            WHERE author_id = feed_authors.id
            ${beforeCursor}
            ORDER BY created_at DESC, id DESC
            LIMIT ${take}
          ) AS post
          ORDER BY post.created_at DESC, post.id DESC
          LIMIT ${take}
        )
        SELECT
          page.id,
          page.image_url AS "imageUrl",
          page.caption,
          page.created_at AS "createdAt",
          jsonb_build_object(
            'id', author.id,
            'username', author.username,
            'fullName', author.full_name,
            'avatarUrl', author.avatar_url
          ) AS author,
          reactions.like_count AS "likeCount",
          reactions.liked_by_me AS "likedByMe"
        FROM feed_page AS page
        JOIN users AS author ON author.id = page.author_id
        CROSS JOIN LATERAL (
          SELECT
            COUNT(*)::integer AS like_count,
            COALESCE(BOOL_OR(user_id = ${viewerId}::uuid), false) AS liked_by_me
          FROM likes
          WHERE post_id = page.id
        ) AS reactions
        ORDER BY page.created_at DESC, page.id DESC
      `;
    } catch (error) {
      throw toRepositoryError(error);
    }
  }
}

export const feedRepository = new FeedRepository();
