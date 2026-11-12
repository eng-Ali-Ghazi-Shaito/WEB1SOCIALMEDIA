import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { POST_LIKE_CHANGE_LIMIT, POST_LIKE_WINDOW_MINUTES } from "@/config/constants";
import { env } from "@/config/env";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PostLikeRepository, postLikeRepository } from "@/repositories/post-like.repository";
import { authenticationService } from "@/services/Authentication.service";
import { PUT } from "./route";

const databaseUrl = process.env.API14_TEST_DATABASE_URL;
const authorId = randomUUID();
const actorId = randomUUID();
const otherId = randomUUID();
const userIds = [authorId, actorId, otherId];
const tokens = new Map<string, string>();
let db: PrismaClient;

function invoke(postId: string, liked: boolean, userId: string = actorId) {
  const request = new NextRequest(`http://localhost:3000/api/posts/${postId}/like`, {
    method: "PUT",
    headers: { origin: env.APP_URL, cookie: `${ACCESS_TOKEN_COOKIE}=${tokens.get(userId)}` },
    body: JSON.stringify({ liked }),
  });
  return PUT(request, { params: Promise.resolve({ id: postId }) });
}

async function expectLike(postId: string, liked: boolean, likeCount: number, userId: string = actorId) {
  const response = await invoke(postId, liked, userId);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ liked, likeCount });
}

async function createPost() {
  const id = randomUUID();
  await db.post.create({
    data: { id, authorId, imageUrl: "https://example.invalid/post.jpg", imageKey: `api14-test/${id}` },
    select: { id: true },
  });
  return id;
}

async function setQuota(changeTimes: Date[]) {
  const instants = changeTimes.map((time) => Prisma.sql`${time.toISOString()}::timestamptz`);
  await db.$executeRaw`
    INSERT INTO post_like_rate_limits (user_id, change_times)
    VALUES (${actorId}::uuid, ARRAY[${Prisma.join(instants)}])
    ON CONFLICT (user_id) DO UPDATE SET change_times = EXCLUDED.change_times
  `;
}

async function usedQuota(): Promise<number> {
  const [row] = await db.$queryRaw<{ count: number }[]>`
    SELECT cardinality(change_times) AS count FROM post_like_rate_limits WHERE user_id = ${actorId}::uuid
  `;
  return row?.count ?? 0;
}

describe.skipIf(!databaseUrl)("API 14 against PostgreSQL", () => {
  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    await db.user.createMany({
      data: userIds.map((id) => ({
        id,
        email: `${id}@api14.example.invalid`,
        username: id.replaceAll("-", "").slice(0, 30),
        fullName: "API 14 test user",
        passwordHash: "unused-test-password-hash",
        emailVerifiedAt: new Date(),
      })),
    });
    for (const userId of userIds) {
      tokens.set(userId, await authenticationService.generateToken(userId));
    }
  });

  beforeEach(async () => {
    await db.post.deleteMany({ where: { authorId } });
    await db.$executeRaw`
      DELETE FROM post_like_rate_limits
      WHERE user_id IN (${authorId}::uuid, ${actorId}::uuid, ${otherId}::uuid)
    `;
    const repository = new PostLikeRepository(db);
    vi.spyOn(postLikeRepository, "transaction").mockImplementation(repository.transaction.bind(repository));
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

  it("commits one like and one notification across concurrent requests and retries", async () => {
    const postId = await createPost();
    await Promise.all([expectLike(postId, true, 1), expectLike(postId, true, 1)]);

    expect(await db.like.count({ where: { postId, userId: actorId } })).toBe(1);
    const notice = await db.notification.findFirstOrThrow({
      where: { postId, actorId, recipientId: authorId, type: "LIKE" },
      select: { id: true },
    });
    const readAt = new Date("2026-11-01T12:00:00.000Z");
    await db.notification.update({ where: { id: notice.id }, data: { readAt }, select: { id: true } });
    await expectLike(postId, true, 1);

    expect(await db.notification.findMany({ where: { postId }, select: { id: true, readAt: true } }))
      .toEqual([{ id: notice.id, readAt }]);
    expect(await usedQuota()).toBe(1);
  });

  it("removes only the actor's like and matching notification", async () => {
    const postId = await createPost();
    await expectLike(postId, false, 0);
    expect(await usedQuota()).toBe(0);

    await expectLike(postId, true, 1);
    await expectLike(postId, true, 2, otherId);
    await expectLike(postId, false, 1);
    await expectLike(postId, false, 1);

    expect(await db.like.findMany({ where: { postId }, select: { userId: true } })).toEqual([{ userId: otherId }]);
    expect(await db.notification.findMany({ where: { postId }, select: { actorId: true } }))
      .toEqual([{ actorId: otherId }]);
    expect(await usedQuota()).toBe(2);
  });

  it("allows self-likes without a notification", async () => {
    const postId = await createPost();
    await expectLike(postId, true, 1, authorId);
    expect(await db.notification.count({ where: { postId } })).toBe(0);
  });

  it("returns 404 when the post has been deleted", async () => {
    const postId = await createPost();
    await db.post.delete({ where: { id: postId }, select: { id: true } });

    expect((await invoke(postId, true)).status).toBe(404);
    expect((await invoke(postId, false)).status).toBe(404);
    expect(await usedQuota()).toBe(0);
  });

  it("shares a rolling quota across posts and rolls back denied changes", async () => {
    const recent = Array.from({ length: POST_LIKE_CHANGE_LIMIT - 1 }, () => new Date());
    await setQuota(recent);
    const postIds = await Promise.all([createPost(), createPost()]);
    const results = await Promise.all(postIds.map(async (id) => ({ id, response: await invoke(id, true) })));

    expect(results.map(({ response }) => response.status).sort()).toEqual([200, 429]);
    const accepted = results.find(({ response }) => response.ok);
    const denied = results.find(({ response }) => response.status === 429);
    if (!accepted || !denied) throw new Error("Expected one accepted and one rate-limited change");
    expect(await denied.response.json()).toMatchObject({ error: { code: "TOO_MANY_REQUESTS" } });
    expect(await usedQuota()).toBe(POST_LIKE_CHANGE_LIMIT);

    await expectLike(accepted.id, true, 1);
    expect((await invoke(accepted.id, false)).status).toBe(429);
    expect(await db.like.findMany({ where: { userId: actorId }, select: { postId: true } }))
      .toEqual([{ postId: accepted.id }]);
    expect(await db.notification.findMany({ where: { actorId }, select: { postId: true } }))
      .toEqual([{ postId: accepted.id }]);

    const expired = new Date(Date.now() - (POST_LIKE_WINDOW_MINUTES + 1) * 60 * 1000);
    await setQuota([expired, ...recent]);
    await expectLike(denied.id, true, 1);
    expect(await usedQuota()).toBe(POST_LIKE_CHANGE_LIMIT);
  });
});
