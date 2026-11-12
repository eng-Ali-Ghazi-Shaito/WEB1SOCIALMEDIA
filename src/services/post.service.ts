import { postRepository, type PostRepository } from "@/repositories/post.repository";
import type { DeletedPostImage } from "@/types/post.types";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { ForbiddenException } from "@/util/exceptions/http/ForbiddenException";
import { NotFoundException } from "@/util/exceptions/http/NotFoundException";
import { ServiceUnavailableException } from "@/util/exceptions/http/ServiceUnavailableException";
import { RecordNotFoundException } from "@/util/exceptions/repositoryExceptions";
import { logger } from "@/util/logger";
import { imageStorageService, type ImageStorageService } from "./image-storage.service";

export class PostService {
  constructor(
    private readonly posts: Pick<PostRepository, "findDeletionTarget" | "deleteOwnedPost"> = postRepository,
    private readonly images: Pick<ImageStorageService, "deleteImage"> = imageStorageService,
    private readonly log: Pick<typeof logger, "error"> = logger,
  ) {}

  async deletePost(postId: string, userId: string): Promise<void> {
    let image: DeletedPostImage;
    try {
      const post = await this.posts.findDeletionTarget(postId);
      if (!post) throw new NotFoundException("Post not found");
      if (post.authorId.toLowerCase() !== userId.toLowerCase()) {
        throw new ForbiddenException("You can only delete your own posts");
      }
      image = await this.posts.deleteOwnedPost(postId, userId);
    } catch (error) {
      if (error instanceof RecordNotFoundException) {
        throw new NotFoundException("Post not found");
      }
      if (error instanceof DatabaseConnectionException) {
        throw new ServiceUnavailableException("Database temporarily unavailable");
      }
      throw error;
    }

    // The database deletion is committed before contacting external storage.
    try {
      await this.images.deleteImage(image.imageKey);
    } catch {
      // Provider errors can contain credentials. Log only the identifiers needed for cleanup.
      this.log.error(`Image cleanup required ${JSON.stringify({ postId, imageKey: image.imageKey })}`);
    }
  }
}

export const postService = new PostService();
