import { FEED_PAGE_SIZE } from "@/config/constants";
import { feedRepository, type FeedRepository } from "@/repositories/feed.repository";
import type { FeedPage, FeedQuery } from "@/types/feed.types";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { ServiceUnavailableException } from "@/util/exceptions/http/ServiceUnavailableException";

export class FeedService {
  constructor(private readonly feed: Pick<FeedRepository, "findPage"> = feedRepository) {}

  async getFeed(viewerId: string, query: FeedQuery): Promise<FeedPage> {
    try {
      const rows = await this.feed.findPage(viewerId, query.cursor, FEED_PAGE_SIZE + 1);
      const posts = rows.slice(0, FEED_PAGE_SIZE).map(({ createdAt, ...post }) => ({
        ...post,
        createdAt: createdAt.toISOString(),
      }));

      // The cursor keeps the sort values so pagination survives deletion of the boundary post.
      const lastPost = posts.at(-1);
      const nextCursor = rows.length > FEED_PAGE_SIZE && lastPost
        ? `${lastPost.createdAt}_${lastPost.id}`
        : null;

      return { posts, nextCursor };
    } catch (error) {
      if (error instanceof DatabaseConnectionException) {
        throw new ServiceUnavailableException("Database temporarily unavailable");
      }
      throw error;
    }
  }
}

export const feedService = new FeedService();
