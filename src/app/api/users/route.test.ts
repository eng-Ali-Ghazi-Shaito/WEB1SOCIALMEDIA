import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { USER_SEARCH_PAGE_SIZE } from "@/config/constants";
import { userRepository } from "@/repositories/user.repository";
import { authenticationService } from "@/services/Authentication.service";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { GET } from "./route";

const VIEWER_ID = "11111111-aaaa-4111-8111-111111111111";
let accessToken: string;

const MATCH = {
  id: "22222222-bbbb-4222-8222-222222222222",
  username: "ali_test",
  fullName: "Ali Test",
  avatarUrl: null,
};

function invoke(query = "?q=ali", token: string | null = accessToken) {
  const request = new NextRequest(`http://localhost:3000/api/users${query}`, {
    headers: token ? { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } : undefined,
  });
  return GET(request, undefined);
}

beforeAll(async () => {
  accessToken = await authenticationService.generateToken(VIEWER_ID);
});

beforeEach(() => {
  vi.spyOn(userRepository, "searchUsers").mockResolvedValue([MATCH]);
});

afterEach(() => vi.restoreAllMocks());

describe("GET /api/users", () => {
  it("returns the matching users", async () => {
    const response = await invoke();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ users: [MATCH] });
    expect(userRepository.searchUsers).toHaveBeenCalledExactlyOnceWith("ali", USER_SEARCH_PAGE_SIZE);
  });

  it("trims and lowercases the query", async () => {
    expect((await invoke("?q=%20%20ALI%20%20")).status).toBe(200);
    expect(userRepository.searchUsers).toHaveBeenCalledExactlyOnceWith("ali", USER_SEARCH_PAGE_SIZE);
  });

  it.each(["", "?q=", "?q=%20%20", `?q=${"a".repeat(31)}`, "?q=a&q=b", "?q=ali&limit=5"])(
    "rejects an invalid query before database access (%s)",
    async (query) => {
      expect((await invoke(query)).status).toBe(400);
      expect(userRepository.searchUsers).not.toHaveBeenCalled();
    },
  );

  it.each([null, "invalid-token"])("requires a valid access cookie (%s)", async (token) => {
    expect((await invoke("?q=ali", token)).status).toBe(401);
    expect(userRepository.searchUsers).not.toHaveBeenCalled();
  });

  it("answers 503 when the database is unreachable", async () => {
    vi.spyOn(userRepository, "searchUsers").mockRejectedValue(
      new DatabaseConnectionException(new Error("connection refused")),
    );
    expect((await invoke()).status).toBe(503);
  });
});