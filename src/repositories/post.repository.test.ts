import { describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { RecordNotFoundException } from "@/util/exceptions/repositoryExceptions";
import { PostRepository } from "./post.repository";

function createRepository() {
  const post = { findUnique: vi.fn(), delete: vi.fn() };
  return { post, repository: new PostRepository({ post }) };
}

describe("PostRepository", () => {
  it("guards the delete with the owner ID and returns only the stored image key", async () => {
    const { repository, post } = createRepository();
    post.delete.mockResolvedValue({ imageKey: "posts/stored-public-id" });
    await expect(repository.deleteOwnedPost("post-id", "owner-id")).resolves.toEqual({
      imageKey: "posts/stored-public-id",
    });
    expect(post.delete).toHaveBeenCalledWith({
      where: { id: "post-id", authorId: "owner-id" },
      select: { imageKey: true },
    });
  });

  it("translates a concurrent deletion into a repository not-found error", async () => {
    const { repository, post } = createRepository();
    post.delete.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Missing", {
      code: "P2025",
      clientVersion: "7.10.1",
    }));
    await expect(repository.deleteOwnedPost("post-id", "owner-id")).rejects.toBeInstanceOf(
      RecordNotFoundException,
    );
  });

  it("recognizes pg adapter connection failures for the service's 503 response", async () => {
    const { repository, post } = createRepository();
    post.findUnique.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Unavailable", {
      code: "P1001",
      clientVersion: "7.10.1",
    }));
    await expect(repository.findDeletionTarget("post-id")).rejects.toBeInstanceOf(
      DatabaseConnectionException,
    );
  });
});
