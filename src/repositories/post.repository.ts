import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DeletedPostImage, PostDeletionTarget } from "@/types/post.types";
import { RecordNotFoundException } from "@/util/exceptions/repositoryExceptions";
import { toRepositoryError } from "@/util/exceptions/toRepositoryError";

type PostDatabase = {
  post: Pick<PrismaClient["post"], "findUnique" | "delete">;
};

export class PostRepository {
  constructor(private readonly db: PostDatabase = prisma) {}

  async findDeletionTarget(id: string): Promise<PostDeletionTarget | null> {
    try {
      return await this.db.post.findUnique({
        where: { id },
        select: { id: true, authorId: true },
      });
    } catch (error) {
      throw toRepositoryError(error);
    }
  }

  async deleteOwnedPost(id: string, authorId: string): Promise<DeletedPostImage> {
    try {
      // The owner condition also protects the write if the post changes after the service check.
      return await this.db.post.delete({
        where: { id, authorId },
        select: { imageKey: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        throw new RecordNotFoundException("Post no longer exists", error);
      }
      throw toRepositoryError(error);
    }
  }
}

export const postRepository = new PostRepository();
