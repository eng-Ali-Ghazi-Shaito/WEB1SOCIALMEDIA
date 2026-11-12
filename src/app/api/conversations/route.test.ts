import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { CONVERSATION_PAGE_SIZE } from "@/config/constants";
import { conversationRepository } from "@/repositories/conversation.repository";
import { authenticationService } from "@/services/Authentication.service";
import { GET } from "./route";

const VIEWER_ID = "11111111-aaaa-4111-8111-111111111111";
const CONVERSATION_ID = "22222222-bbbb-4222-8222-222222222222";
const LAST_MESSAGE_AT = "2026-11-01T12:30:00.123Z";
let accessToken: string;

function invoke(query = "", token: string | null = accessToken) {
  const request = new NextRequest(`http://localhost:3000/api/conversations${query}`, {
    headers: token ? { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } : undefined,
  });
  return GET(request, undefined);
}

beforeAll(async () => {
  accessToken = await authenticationService.generateToken(VIEWER_ID);
});

beforeEach(() => {
  vi.spyOn(conversationRepository, "findPage").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("GET /api/conversations", () => {
  it("returns a private, empty inbox for the signed-in viewer", async () => {
    const response = await invoke();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ conversations: [], nextCursor: null });
    expect(conversationRepository.findPage).toHaveBeenCalledExactlyOnceWith(
      VIEWER_ID, undefined, CONVERSATION_PAGE_SIZE + 1,
    );
  });

  it("requires authentication before querying conversations", async () => {
    expect((await invoke("", null)).status).toBe(401);
    expect(conversationRepository.findPage).not.toHaveBeenCalled();
  });

  it("uses the cursor's last-message timestamp and conversation ID", async () => {
    const query = new URLSearchParams({ cursor: `${LAST_MESSAGE_AT}_${CONVERSATION_ID}` });
    expect((await invoke(`?${query}`)).status).toBe(200);
    expect(conversationRepository.findPage).toHaveBeenCalledExactlyOnceWith(
      VIEWER_ID, { lastMessageAt: new Date(LAST_MESSAGE_AT), id: CONVERSATION_ID }, CONVERSATION_PAGE_SIZE + 1,
    );
  });

  it.each(["?cursor=invalid", "?cursor=a&cursor=b", "?userId=someone-else"])(
    "rejects an invalid query (%s)",
    async (query) => {
      const response = await invoke(query);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "BAD_REQUEST" } });
      expect(conversationRepository.findPage).not.toHaveBeenCalled();
    },
  );
});
