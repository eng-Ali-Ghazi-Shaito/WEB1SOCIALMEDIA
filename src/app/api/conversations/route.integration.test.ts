import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { CONVERSATION_PAGE_SIZE } from "@/config/constants";
import { PrismaClient } from "@/generated/prisma/client";
import { ConversationRepository, conversationRepository } from "@/repositories/conversation.repository";
import { authenticationService } from "@/services/Authentication.service";
import type { ConversationPage } from "@/types/conversation.types";
import { GET } from "./route";

const databaseUrl = process.env.API15_TEST_DATABASE_URL;
const viewerId = `8${randomUUID().slice(1)}`;
const lowerId = `1${randomUUID().slice(1)}`;
const higherId = `e${randomUUID().slice(1)}`;
const unverifiedId = randomUUID();
const contacts = [lowerId, higherId, ...Array.from({ length: CONVERSATION_PAGE_SIZE }, () => randomUUID())];
const userIds = [viewerId, unverifiedId, ...contacts];
const baseTime = Date.parse("2026-11-01T12:30:00.123Z");
let db: PrismaClient;
let accessToken: string;

function timestamp(seconds = 0) {
  return new Date(baseTime + seconds * 1000);
}

function username(id: string) {
  return id.replaceAll("-", "").slice(0, 30);
}

function pair(first: string, second: string) {
  const [userAId, userBId] = [first, second].sort();
  return { userAId, userBId };
}

function message(conversationId: string, senderId: string, body: string, createdAt: Date) {
  return { id: randomUUID(), clientMessageId: randomUUID(), conversationId, senderId, body, createdAt };
}

async function readInbox(cursor?: string | null): Promise<ConversationPage> {
  const url = new URL("http://localhost:3000/api/conversations");
  if (cursor) url.searchParams.set("cursor", cursor);
  const response = await GET(new NextRequest(url, {
    headers: { cookie: `${ACCESS_TOKEN_COOKIE}=${accessToken}` },
  }), undefined);
  expect(response.status).toBe(200);
  return response.json();
}

describe.skipIf(!databaseUrl)("API 15 against PostgreSQL", () => {
  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, options: "-c timezone=Asia/Beirut" }) });
    await db.user.createMany({
      data: userIds.map((id) => ({
        id,
        email: `${id}@api15.example.invalid`,
        username: username(id),
        fullName: "API 15 test user",
        passwordHash: "unused-test-password-hash",
        emailVerifiedAt: id === unverifiedId ? null : timestamp(),
      })),
    });
    accessToken = await authenticationService.generateToken(viewerId);
  });

  beforeEach(async () => {
    await db.conversation.deleteMany({
      where: { userAId: { in: userIds }, userBId: { in: userIds } },
    });
    const repository = new ConversationRepository(db);
    vi.spyOn(conversationRepository, "findPage").mockImplementation(repository.findPage.bind(repository));
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

  it("returns only the viewer's chats and uses their own read marker on either side", async () => {
    const newerId = randomUUID();
    const olderId = randomUUID();
    const unrelatedId = randomUUID();
    const latest = message(newerId, viewerId, "My newest reply", timestamp(3));
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL TIME ZONE 'UTC'`;
      await tx.conversation.createMany({
        data: [
          {
            id: newerId, ...pair(viewerId, higherId), createdAt: timestamp(0), lastMessageAt: timestamp(3),
            userALastReadAt: timestamp(1), userBLastReadAt: timestamp(4),
          },
          {
            id: olderId, ...pair(viewerId, lowerId), createdAt: timestamp(1), lastMessageAt: timestamp(2),
            userBLastReadAt: timestamp(2),
          },
          { id: unrelatedId, ...pair(higherId, lowerId), lastMessageAt: timestamp(4) },
          { ...pair(viewerId, unverifiedId), lastMessageAt: timestamp(5) },
        ],
      });

      await tx.message.createMany({
        data: [
          message(newerId, higherId, "Unread incoming", timestamp(2)),
          latest,
          message(olderId, lowerId, "Already read", timestamp(2)),
          message(unrelatedId, lowerId, "Private to other users", timestamp(4)),
        ],
      });
    });

    const page = await readInbox();
    expect(page.conversations.map(({ id }) => id)).toEqual([newerId, olderId]);
    expect(page.conversations[0]).toEqual({
      id: newerId,
      otherUser: { id: higherId, username: username(higherId), fullName: "API 15 test user", avatarUrl: null },
      lastMessage: { id: latest.id, senderId: viewerId, body: latest.body, createdAt: latest.createdAt.toISOString() },
      lastMessageAt: latest.createdAt.toISOString(),
      unread: true,
    });
    expect(page.conversations[1]).toMatchObject({ otherUser: { id: lowerId }, unread: false });
    expect(page.nextCursor).toBeNull();
  });

  it("paginates tied timestamps by ID after the cursor conversation is deleted", async () => {
    const chats = contacts.map((contact) => ({
      id: randomUUID(), ...pair(viewerId, contact), lastMessageAt: timestamp(),
    }));
    await db.conversation.createMany({ data: chats });
    const sortedIds = chats.map(({ id }) => id).sort().reverse();

    const first = await readInbox();
    expect(first.conversations.map(({ id }) => id)).toEqual(sortedIds.slice(0, CONVERSATION_PAGE_SIZE));
    expect(first.conversations[0]).toMatchObject({ lastMessage: null, unread: false });
    expect(first.nextCursor).not.toBeNull();

    await db.conversation.delete({
      where: { id: sortedIds[CONVERSATION_PAGE_SIZE - 1] },
      select: { id: true },
    });

    const next = await readInbox(first.nextCursor);
    expect(next.conversations.map(({ id }) => id)).toEqual(sortedIds.slice(CONVERSATION_PAGE_SIZE));
    expect(next.nextCursor).toBeNull();
  });
});
