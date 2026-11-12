import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

import { env } from "@/config/env";
import { ServiceException } from "@/util/exceptions/ServiceException";

const IMAGE_DELETE_TIMEOUT_MS = 10_000;
const destroyResultSchema = z.object({
  result: z.enum(["ok", "not found"]),
});

type CloudinaryCredentials = Pick<
  typeof env,
  "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET"
>;

export class ImageStorageService {
  constructor(
    private readonly credentials: CloudinaryCredentials = {
      CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
    },
    private readonly uploader: Pick<typeof cloudinary.uploader, "destroy"> = cloudinary.uploader,
  ) {}

  async deleteImage(imageKey: string): Promise<void> {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = this.credentials;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new ServiceException("Cloudinary credentials are not configured");
    }
    const options = {
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      resource_type: "image" as const,
      type: "upload" as const,
      invalidate: true,
      timeout: IMAGE_DELETE_TIMEOUT_MS,
    };
    const result: unknown = await this.uploader.destroy(imageKey, options);
    if (!destroyResultSchema.safeParse(result).success) {
      throw new ServiceException("Cloudinary did not confirm image deletion");
    }
  }
}

export const imageStorageService = new ImageStorageService();
