import { describe, expect, it, vi } from "vitest";
import { ImageStorageService } from "./image-storage.service";

const credentials = {
  CLOUDINARY_CLOUD_NAME: "test-cloud",
  CLOUDINARY_API_KEY: "test-key",
  CLOUDINARY_API_SECRET: "test-secret",
};

describe("ImageStorageService", () => {
  it("uses the stored public ID and invalidates cached image copies", async () => {
    const destroy = vi.fn().mockResolvedValue({ result: "ok" });
    await new ImageStorageService(credentials, { destroy }).deleteImage("posts/image-key");
    expect(destroy).toHaveBeenCalledWith("posts/image-key", expect.objectContaining({
      cloud_name: "test-cloud",
      api_key: "test-key",
      api_secret: "test-secret",
      resource_type: "image",
      type: "upload",
      invalidate: true,
      timeout: 10_000,
    }));
  });

  it("accepts an image that has already been removed", async () => {
    const destroy = vi.fn().mockResolvedValue({ result: "not found" });
    await expect(new ImageStorageService(credentials, { destroy }).deleteImage("gone")).resolves.toBeUndefined();
  });

  it("reports missing configuration without making an unauthenticated request", async () => {
    const destroy = vi.fn();
    await expect(new ImageStorageService({}, { destroy }).deleteImage("image")).rejects.toThrow(
      "Cloudinary credentials are not configured",
    );
    expect(destroy).not.toHaveBeenCalled();
  });

  it.each([{ result: "error" }, {}, undefined])("rejects an unconfirmed provider response (%j)", async (result) => {
    const destroy = vi.fn().mockResolvedValue(result);
    await expect(new ImageStorageService(credentials, { destroy }).deleteImage("image")).rejects.toThrow(
      "Cloudinary did not confirm image deletion",
    );
  });
});
