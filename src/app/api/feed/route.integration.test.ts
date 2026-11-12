import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { FEED_PAGE_SIZE } from "@/config/constants";
import { PrismaClient } from "@/generated/prisma/client";
import { FeedRepository, feedRepository } from "@/repositories/feed.repository";
import { authenticationService } from "@/services/Authentication.service";
import type { FeedPage } from "@/types/feed.types";
import { GET } from "./route";

const databaseUrl = process.env.API13_TEST_DATABASE_URL;
const viewerId = randomUUID();
const followedId = randomUUID();
const otherId = randomUUID();
const userIds = [viewerId, followedId, otherId];
const createdAt = new Date("2026-11-01T12:30:00.123Z");
let db: PrismaClient;
let accessToken: string;

function postData(authorId: string, id = randomUUID(), timestamp = createdAt) {
  return {
    id,
    authorId,
    imageUrl: `https://example.invalid/${id}.jpg`,
    imageKey: `api13-test/${id}`,
    createdAt: timestamp,
  };
}

function username(id: string) {
  return id.replaceAll("-", "").slice(0, 30);
}

async function readFeed(cursor?: string | null): Promise<FeedPage> {
  const url = new URL("http://localhost:3000/api/feed");
  if (cursor) url.searchParams.set("cursor", cursor);
  const response = await GET(new NextRequest(url, {
    headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${accessToken}` },
  }), undefined);
  expect(response.status).toBe(200);
  return response.json();
}

describe.skipIf(!databaseUrl)("API 13 against PostgreSQL", () => {
  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    await db.user.createMany({
      data: userIds.map((id) => ({
        id,
        email: `${id}@api13.example.invalid`,
        username: username(id),
        fullName: "Feed test user",
        passwordHash: "unused-test-password-hash",
        emailVerifiedAt: createdAt,
      })),
    });
    accessToken = await authenticationService.generateToken(viewerId);
  });

  beforeEach(async () => {
    await db.post.deleteMany({ where: { authorId: { in: userIds } } });
    await db.follow.deleteMany({ where: { followerId: { in: userIds } } });
    const repository = new FeedRepository(db);
    vi.spyOn(feedRepository, "findPage").mockImplementation(repository.findPage.bind(repository));
  });

  afterEach(() => vi.restoreAllMocks());

  afterAll(async () => {
    if (db) {
      try {
        await db.user.deleteMany({ where: { id: { in: userIds } } });
      } finally {
        await db.$disconnect();
      }
    }
  });

  it("returns only the viewer's own posts when they follow nobody", async () => {
    const own = postData(viewerId);
    await db.post.createMany({ data: [own, postData(otherId)] });
    await db.follow.create({ data: { followerId: otherId, followingId: viewerId } });

    const page = await readFeed();
    expect(page.posts.map(({ id }) => id)).toEqual([own.id]);
    expect(page.nextCursor).toBeNull();
  });

  it("returns followed authors and viewer-specific likes in a single query", async () => {
    const followed = postData(followedId);
    const own = postData(viewerId, randomUUID(), new Date(createdAt.getTime() - 1));
    await db.follow.create({ data: { followerId: viewerId, followingId: followedId } });
    await db.post.createMany({ data: [followed, own, postData(otherId)] });
    await db.like.createMany({
      data: [viewerId, otherId].map((userId) => ({ userId, postId: followed.id })),
    });

    const query = vi.spyOn(db, "$queryRaw");
    const page = await readFeed();

    expect(query).toHaveBeenCalledTimes(1);
    expect(page.posts.map(({ id }) => id)).toEqual([followed.id, own.id]);
    expect(page.posts[0]).toEqual({
      id: followed.id,
      imageUrl: followed.imageUrl,
      caption: null,
      createdAt: createdAt.toISOString(),
      author: { id: followedId, username: username(followedId), fullName: "Feed test user", avatarUrl: null },
      likeCount: 2,
      likedByMe: true,
    });
    expect(page.posts[1]).toMatchObject({ likeCount: 0, likedByMe: false });
  });

  it("continues a tied timestamp page after newer inserts and deletion of the cursor post", async () => {
    const ids = Array.from({ length: FEED_PAGE_SIZE + 2 }, () => randomUUID()).sort().reverse();
    await db.post.createMany({ data: ids.map((id) => postData(viewerId, id)) });

    const first = await readFeed();
    expect(first.posts.map(({ id }) => id)).toEqual(ids.slice(0, FEED_PAGE_SIZE));
    expect(first.nextCursor).not.toBeNull();

    const newer = postData(viewerId, randomUUID(), new Date(createdAt.getTime() + 1));
    await db.post.create({ data: newer });
    await db.post.delete({ where: { id: ids[FEED_PAGE_SIZE - 1] } });

    const next = await readFeed(first.nextCursor);
    expect(next.posts.map(({ id }) => id)).toEqual(ids.slice(FEED_PAGE_SIZE));
    expect(next.nextCursor).toBeNull();
  });

  it("applies an unfollow to the next request", async () => {
    const follow = { followerId: viewerId, followingId: followedId };
    const post = postData(followedId);
    await db.follow.create({ data: follow });
    await db.post.create({ data: post });
    expect((await readFeed()).posts.map(({ id }) => id)).toEqual([post.id]);

    await db.follow.delete({ where: { followerId_followingId: follow } });
    expect(await readFeed()).toEqual({ posts: [], nextCursor: null });
  });
});
