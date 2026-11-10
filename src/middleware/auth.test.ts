import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { authenticationService } from "@/services/Authentication.service";
import type { AuthRequest } from "@/types/auth.types";
import { authenticate } from "./auth";
import { withErrorHandler } from "./errorHandler";

const context = { params: Promise.resolve({ id: "1" }) };

function requestWith(token?: string, extraHeaders: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/posts", {
    method: "POST",
    headers: {
      ...extraHeaders,
      ...(token !== undefined ? { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } : {}),
    },
  });
}

function createRoute() {
  const handler = vi.fn(async (req: AuthRequest, _context: typeof context) =>
    NextResponse.json({ userId: req.userId }),
  );
  return { handler, route: withErrorHandler(authenticate(handler)) };
}

describe("authenticate", () => {
  it.each([
    ["no cookie", undefined, {}, "AUTHENTICATION_FAILED"],
    ["an empty cookie", "", {}, "AUTHENTICATION_FAILED"],
    ["only a Bearer header (no longer accepted)", undefined, { authorization: "Bearer abc" }, "AUTHENTICATION_FAILED"],
    ["a bad token", "not-a-token", {}, "INVALID_TOKEN"],
  ])("returns 401 JSON for %s", async (_name, token, headers, code) => {
    const { handler, route } = createRoute();
    const response = await route(requestWith(token, headers), context);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code } });
    expect(handler).not.toHaveBeenCalled();
  });

  it("gives the handler the userId and the untouched context", async () => {
    const { handler, route } = createRoute();
    const token = await authenticationService.generateToken("user-1");
    const response = await route(requestWith(token), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: "user-1" });
    expect(handler.mock.calls[0]?.[1]).toBe(context);
  });
});