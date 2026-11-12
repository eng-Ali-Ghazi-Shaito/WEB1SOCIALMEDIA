import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { JSON_BODY_MAX_BYTES } from "@/config/constants";
import { env } from "@/config/env";
import { authenticationService } from "@/services/Authentication.service";
import { postLikeService } from "@/services/post-like.service";
import { PUT } from "./route";

const POST_ID = "11111111-aaaa-4111-8111-111111111111";
const ACTOR_ID = "22222222-bbbb-4222-8222-222222222222";
const VALID_BODY = '{"liked":true}';
let accessToken: string;

function invoke(body = VALID_BODY, id = POST_ID, token: string | null = accessToken, origin = env.APP_URL) {
  const request = new NextRequest(`http://localhost:3000/api/posts/${encodeURIComponent(id)}/like`, {
    method: "PUT",
    headers: {
      origin,
      "content-type": "application/json",
      ...(token ? { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } : {}),
    },
    body,
  });
  return PUT(request, { params: Promise.resolve({ id }) });
}

beforeAll(async () => {
  accessToken = await authenticationService.generateToken(ACTOR_ID);
});

beforeEach(() => {
  vi.spyOn(postLikeService, "setLike").mockResolvedValue({ liked: true, likeCount: 1 });
});

afterEach(() => vi.restoreAllMocks());

describe("PUT /api/posts/:id/like", () => {
  it("validates the post ID and sets the requested state for the signed-in user", async () => {
    const response = await invoke(VALID_BODY, POST_ID.toUpperCase());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ liked: true, likeCount: 1 });
    expect(postLikeService.setLike).toHaveBeenCalledExactlyOnceWith(POST_ID, ACTOR_ID, { liked: true });
  });

  it("requires a valid access cookie and blocks cross-site writes", async () => {
    expect((await invoke(VALID_BODY, POST_ID, null)).status).toBe(401);
    expect((await invoke(VALID_BODY, POST_ID, accessToken, "https://other.example")).status).toBe(403);
    expect(postLikeService.setLike).not.toHaveBeenCalled();
  });

  it("rejects malformed post IDs before the service is called", async () => {
    const response = await invoke(VALID_BODY, "not-a-uuid");
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { fields: { id: expect.any(Array) } } });
    expect(postLikeService.setLike).not.toHaveBeenCalled();
  });

  it.each(["{", "{}", '{"liked":"true"}', '{"liked":true,"actorId":"someone-else"}'])(
    "rejects an invalid JSON body (%s)",
    async (body) => {
      const response = await invoke(body);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: { code: "BAD_REQUEST" } });
      expect(postLikeService.setLike).not.toHaveBeenCalled();
    },
  );

  it("rejects an oversized body before the service is called", async () => {
    const body = VALID_BODY.padEnd(JSON_BODY_MAX_BYTES + 1);
    const response = await invoke(body);

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: { code: "PAYLOAD_TOO_LARGE" } });
    expect(postLikeService.setLike).not.toHaveBeenCalled();
  });
});
