import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { env } from "@/config/env";
import { PrismaClient } from "@/generated/prisma/client";
import { PostRepository, postRepository } from "@/repositories/post.repository";
import { authenticationService } from "@/services/Authentication.service";
import { imageStorageService } from "@/services/image-storage.service";
import { logger } from "@/util/logger";
import { DELETE } from "./route";

// A separate database is explicitly supplied by the integration-test runner.
const databaseUrl = process.env.API12_TEST_DATABASE_URL;
const ownerId = randomUUID();
const otherId = randomUUID();
let db: PrismaClient;
let ownerToken: string;
let otherToken: string;

function invoke(id: string, token = ownerToken) {
  return DELETE(new NextRequest(`http://localhost:3000/api/posts/${id}`, {
    method: "DELETE",
    headers: { origin: env.APP_URL, cookie: `${ACCESS_TOKEN_COOKIE}=${token}` },
  }), { params: Promise.resolve({ id }) });
}

async function createPost() {
  const id = randomUUID();
  return db.post.create({
    data: { id, authorId: ownerId, imageUrl: "https://example.invalid/test.jpg", imageKey: `api12-test/${id}` },
    select: { id: true, imageKey: true },
  });
}

describe.skipIf(!databaseUrl)("API 12 against PostgreSQL", () => {
  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    await db.user.createMany({
      data: [ownerId, otherId].map((id) => ({
        id,
        email: `${id}@api12.example.invalid`,
        username: id.replaceAll("-", "").slice(0, 30),
        fullName: "API 12 integration",
        passwordHash: "unused-test-password-hash",
        emailVerifiedAt: new Date(),
      })),
    });
    ownerToken = await authenticationService.generateToken(ownerId);
    otherToken = await authenticationService.generateToken(otherId);
  });

  beforeEach(() => {
    const repository = new PostRepository(db);
    vi.spyOn(postRepository, "findDeletionTarget").mockImplementation(repository.findDeletionTarget.bind(repository));
    vi.spyOn(postRepository, "deleteOwnedPost").mockImplementation(repository.deleteOwnedPost.bind(repository));
    vi.spyOn(imageStorageService, "deleteImage").mockResolvedValue();
    vi.spyOn(logger, "error").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  afterAll(async () => {
    if (db) {
      try {
        await db.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
      } finally {
        await db.$disconnect();
      }
    }
  });

  it("deletes dependent likes and notifications while preserving unrelated rows", async () => {
    const post = await createPost();
    const otherPost = await createPost();
    await db.like.createMany({
      data: [post.id, otherPost.id].map((postId) => ({ postId, userId: otherId })),
    });
    await db.notification.createMany({
      data: [
        { recipientId: ownerId, actorId: otherId, postId: post.id, type: "LIKE" },
        { recipientId: ownerId, actorId: otherId, postId: otherPost.id, type: "LIKE" },
        { recipientId: ownerId, actorId: otherId, type: "FOLLOW" },
      ],
    });
    expect((await invoke(post.id)).status).toBe(204);
    expect(await db.post.count({ where: { id: post.id } })).toBe(0);
    expect(await db.like.count({ where: { postId: post.id } })).toBe(0);
    expect(await db.notification.count({ where: { postId: post.id } })).toBe(0);
    expect(await db.like.count({ where: { postId: otherPost.id } })).toBe(1);
    expect(await db.notification.count({ where: { postId: otherPost.id } })).toBe(1);
    expect(await db.notification.count({ where: { recipientId: ownerId, type: "FOLLOW" } })).toBe(1);
    expect(imageStorageService.deleteImage).toHaveBeenCalledExactlyOnceWith(post.imageKey);
  });

  it("preserves another user's post and its image", async () => {
    const post = await createPost();
    expect((await invoke(post.id, otherToken)).status).toBe(403);
    expect(await db.post.count({ where: { id: post.id } })).toBe(1);
    expect(imageStorageService.deleteImage).not.toHaveBeenCalled();
  });

  it("allows only one concurrent deletion to succeed and cleans up the image once", async () => {
    const post = await createPost();
    const responses = await Promise.all([invoke(post.id), invoke(post.id)]);
    expect(responses.map((response) => response.status).sort()).toEqual([204, 404]);
    expect(imageStorageService.deleteImage).toHaveBeenCalledExactlyOnceWith(post.imageKey);
  });

  it("keeps the database deletion committed when image storage fails", async () => {
    const post = await createPost();
    vi.mocked(imageStorageService.deleteImage).mockRejectedValue(new Error("Storage unavailable"));
    expect((await invoke(post.id)).status).toBe(204);
    expect(await db.post.count({ where: { id: post.id } })).toBe(0);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(post.imageKey));
  });
});
