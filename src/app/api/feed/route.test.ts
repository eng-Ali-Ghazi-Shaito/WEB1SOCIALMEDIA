import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { FEED_PAGE_SIZE } from "@/config/constants";
import { feedRepository } from "@/repositories/feed.repository";
import { authenticationService } from "@/services/Authentication.service";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { GET } from "./route";

const VIEWER_ID = "11111111-aaaa-4111-8111-111111111111";
const POST_ID = "22222222-bbbb-4222-8222-222222222222";
const CREATED_AT = "2026-11-01T12:30:00.123Z";
let accessToken: string;

function invoke(query = "", token: string | null = accessToken) {
  const request = new NextRequest(`http://localhost:3000/api/feed${query}`, {
    headers: token ? { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } : undefined,
  });
  return GET(request, undefined);
}

beforeAll(async () => {
  accessToken = await authenticationService.generateToken(VIEWER_ID);
});

beforeEach(() => {
  vi.spyOn(feedRepository, "findPage").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("GET /api/feed", () => {
  it("returns an empty private feed for a signed-in viewer", async () => {
    const response = await invoke();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ posts: [], nextCursor: null });
    expect(feedRepository.findPage).toHaveBeenCalledExactlyOnceWith(
      VIEWER_ID, undefined, FEED_PAGE_SIZE + 1,
    );
  });

  it("passes both cursor values to the repository", async () => {
    const query = new URLSearchParams({ cursor: `${CREATED_AT}_${POST_ID}` });
    expect((await invoke(`?${query}`)).status).toBe(200);
    expect(feedRepository.findPage).toHaveBeenCalledExactlyOnceWith(
      VIEWER_ID, { createdAt: new Date(CREATED_AT), id: POST_ID }, FEED_PAGE_SIZE + 1,
    );
  });

  it.each([null, "invalid-token"])("requires a valid access cookie (%s)", async (token) => {
    expect((await invoke("", token)).status).toBe(401);
    expect(feedRepository.findPage).not.toHaveBeenCalled();
  });

  it.each(["?cursor=", "?cursor=invalid", "?cursor=%00", "?cursor=a&cursor=b", "?limit=5"])(
    "rejects an invalid query before database access (%s)",
    async (query) => {
      const response = await invoke(query);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "BAD_REQUEST" } });
      expect(feedRepository.findPage).not.toHaveBeenCalled();
    },
  );

  it("returns the shared 503 response when the database is unavailable", async () => {
    vi.mocked(feedRepository.findPage).mockRejectedValue(new DatabaseConnectionException());
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "SERVICE_UNAVAILABLE" } });
  });
});
