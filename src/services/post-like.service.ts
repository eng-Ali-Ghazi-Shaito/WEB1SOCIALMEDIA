import { POST_LIKE_CHANGE_LIMIT, POST_LIKE_WINDOW_MINUTES } from "@/config/constants";
import { postLikeRepository, type PostLikeRepository } from "@/repositories/post-like.repository";
import type { PostLikeState, SetPostLikeDto } from "@/types/post.types";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { NotFoundException } from "@/util/exceptions/http/NotFoundException";
import { ServiceUnavailableException } from "@/util/exceptions/http/ServiceUnavailableException";
import { TooManyRequestsException } from "@/util/exceptions/http/TooManyRequestsException";

export class PostLikeService {
  constructor(private readonly likes: Pick<PostLikeRepository, "transaction"> = postLikeRepository) {}

  async setLike(postId: string, userId: string, { liked }: SetPostLikeDto): Promise<PostLikeState> {
    const actorId = userId.toLowerCase();
    try {
      return await this.likes.transaction(async (likes) => {
        const authorId = await likes.lockPostAuthor(postId);
        if (!authorId) throw new NotFoundException("Post not found");

        const changed = await likes.setLiked(postId, actorId, liked);
        if (changed) {
          const allowed = await likes.recordChange(actorId, POST_LIKE_CHANGE_LIMIT, POST_LIKE_WINDOW_MINUTES);
          if (!allowed) {
            throw new TooManyRequestsException(
              `You can change post likes up to ${POST_LIKE_CHANGE_LIMIT} times per hour`,
            );
          }
          if (authorId !== actorId) {
            await likes.setNotification(postId, authorId, actorId, liked);
          }
        }

        return { liked, likeCount: await likes.countLikes(postId) };
      });
    } catch (error) {
      if (error instanceof DatabaseConnectionException) {
        throw new ServiceUnavailableException("Database temporarily unavailable");
      }
      throw error;
    }
  }
}

export const postLikeService = new PostLikeService();
