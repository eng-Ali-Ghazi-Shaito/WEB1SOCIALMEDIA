import { NextRequest } from "next/server";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { env } from "@/config/env";
import { postRepository } from "@/repositories/post.repository";
import { authenticationService } from "@/services/Authentication.service";
import { imageStorageService } from "@/services/image-storage.service";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { RecordNotFoundException } from "@/util/exceptions/repositoryExceptions";
import { logger } from "@/util/logger";
import { DELETE } from "./route";

const POST_ID = "11111111-aaaa-4111-8111-111111111111";
const OWNER_ID = "22222222-bbbb-4222-8222-222222222222";
const OTHER_ID = "33333333-cccc-4333-8333-333333333333";
const IMAGE_KEY = "posts/delete-test";
let ownerToken: string;
let otherToken: string;

function invoke(id = POST_ID, token: string | null = ownerToken, origin = env.APP_URL) {
  const request = new NextRequest(`http://localhost:3000/api/posts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      origin,
      ...(token ? { cookie: `${ACCESS_TOKEN_COOKIE}=${token}` } : {}),
    },
  });
  return DELETE(request, { params: Promise.resolve({ id }) });
}

beforeAll(async () => {
  ownerToken = await authenticationService.generateToken(OWNER_ID);
  otherToken = await authenticationService.generateToken(OTHER_ID);
});

beforeEach(() => {
  vi.spyOn(postRepository, "findDeletionTarget").mockResolvedValue({ id: POST_ID, authorId: OWNER_ID });
  vi.spyOn(postRepository, "deleteOwnedPost").mockResolvedValue({ imageKey: IMAGE_KEY });
  vi.spyOn(imageStorageService, "deleteImage").mockResolvedValue();
  vi.spyOn(logger, "error").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("DELETE /api/posts/:id", () => {
  it("deletes the owner's post before cleaning up its image and returns an empty 204", async () => {
    const response = await invoke();
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("content-type")).toBeNull();
    expect(postRepository.deleteOwnedPost).toHaveBeenCalledWith(POST_ID, OWNER_ID);
    expect(imageStorageService.deleteImage).toHaveBeenCalledWith(IMAGE_KEY);
    expect(vi.mocked(postRepository.deleteOwnedPost).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(imageStorageService.deleteImage).mock.invocationCallOrder[0],
    );
  });

  it.each([null, "invalid-token"])("rejects a missing or invalid cookie before database access (%s)", async (token) => {
    expect((await invoke(POST_ID, token)).status).toBe(401);
    expect(postRepository.findDeletionTarget).not.toHaveBeenCalled();
  });

  it("rejects a cross-site request before database access", async () => {
    const response = await invoke(POST_ID, ownerToken, "https://other.example");
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "CSRF_BLOCKED" } });
    expect(postRepository.findDeletionTarget).not.toHaveBeenCalled();
  });

  it.each(["not-a-uuid", "1", "11111111-aaaa-4111-0111-111111111111"])(
    "returns a field validation error for %s",
    async (id) => {
      const response = await invoke(id);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "BAD_REQUEST", fields: { id: expect.any(Array) } },
      });
      expect(postRepository.findDeletionTarget).not.toHaveBeenCalled();
    },
  );

  it("normalizes uppercase UUIDs before querying", async () => {
    expect((await invoke(POST_ID.toUpperCase())).status).toBe(204);
    expect(postRepository.findDeletionTarget).toHaveBeenCalledWith(POST_ID);
  });

  it("returns 404 for a missing or already-deleted post", async () => {
    vi.mocked(postRepository.findDeletionTarget).mockResolvedValue(null);
    expect((await invoke()).status).toBe(404);
    expect(postRepository.deleteOwnedPost).not.toHaveBeenCalled();
    expect(imageStorageService.deleteImage).not.toHaveBeenCalled();
  });

  it("returns 403 for another owner and leaves the post and image untouched", async () => {
    expect((await invoke(POST_ID, otherToken)).status).toBe(403);
    expect(postRepository.deleteOwnedPost).not.toHaveBeenCalled();
    expect(imageStorageService.deleteImage).not.toHaveBeenCalled();
  });

  it("returns 404 if another request deletes the post after the ownership check", async () => {
    vi.mocked(postRepository.deleteOwnedPost).mockRejectedValue(new RecordNotFoundException("Gone"));
    expect((await invoke()).status).toBe(404);
    expect(imageStorageService.deleteImage).not.toHaveBeenCalled();
  });

  it("returns 503 when the database is unavailable", async () => {
    vi.mocked(postRepository.findDeletionTarget).mockRejectedValue(new DatabaseConnectionException());
    const response = await invoke();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "SERVICE_UNAVAILABLE" } });
    expect(imageStorageService.deleteImage).not.toHaveBeenCalled();
  });

  it("hides unexpected database errors and keeps the image when deletion fails", async () => {
    vi.mocked(postRepository.deleteOwnedPost).mockRejectedValue(new Error("internal database details"));
    const response = await invoke();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("internal database details");
    expect(imageStorageService.deleteImage).not.toHaveBeenCalled();
  });

  it("keeps 204 and logs a cleanup reference without provider credentials when storage fails", async () => {
    vi.mocked(imageStorageService.deleteImage).mockRejectedValue(new Error("provider-private-secret"));
    expect((await invoke()).status).toBe(204);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(IMAGE_KEY));
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain("provider-private-secret");
  });
});
