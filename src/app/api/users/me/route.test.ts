import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { userRepository } from "@/repositories/user.repository";
import { authenticationService } from "@/services/Authentication.service";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { GET } from "./route";

const VIEWER_ID = "11111111-aaaa-4111-8111-111111111111";
const CREATED_AT = new Date("2026-11-01T12:30:00.123Z");
let accessToken: string;

const ROW = {
  id: VIEWER_ID,
  email: "ali@test.com",
  username: "ali",
  fullName: "Ali Test",
  bio: null,
  avatarUrl: null,
  createdAt: CREATED_AT,
  unreadNotifications: 2,
  unreadConversations: 1,
};

// The repository is replaced by a fake, so the test never touches the shared database.
function invoke(token: string | null = accessToken) {
  const request = new NextRequest("http://localhost:3000/api/users/me", {
    headers: token ? { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } : undefined,
  });
  return GET(request, undefined);
}

beforeAll(async () => {
  accessToken = await authenticationService.generateToken(VIEWER_ID);
});

beforeEach(() => {
  vi.spyOn(userRepository, "findMe").mockResolvedValue(ROW);
});

afterEach(() => vi.restoreAllMocks());

describe("GET /api/users/me", () => {
  it("returns my account with both unread counts", async () => {
    const response = await invoke();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ ...ROW, createdAt: CREATED_AT.toISOString() });
    expect(userRepository.findMe).toHaveBeenCalledExactlyOnceWith(VIEWER_ID);
  });

  it.each([null, "invalid-token"])("requires a valid access cookie (%s)", async (token) => {
    expect((await invoke(token)).status).toBe(401);
    expect(userRepository.findMe).not.toHaveBeenCalled();
  });

  it("answers 401 when the signed-in account no longer exists", async () => {
    vi.spyOn(userRepository, "findMe").mockResolvedValue(null);
    expect((await invoke()).status).toBe(401);
  });

  it("answers 503 when the database is unreachable", async () => {
    vi.spyOn(userRepository, "findMe").mockRejectedValue(
      new DatabaseConnectionException(new Error("connection refused")),
    );
    expect((await invoke()).status).toBe(503);
  });
});
