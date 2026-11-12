import { NextResponse } from "next/server";
import { z } from "zod";

import { postService, type PostService } from "@/services/post.service";
import type { AuthRequest } from "@/types/auth.types";
import type { PostRouteContext } from "@/types/post.types";
import { BadRequestException } from "@/util/exceptions/http/BadRequestException";
import { postIdParamsSchema } from "@/validations/post.schema";

export class PostController {
  constructor(private readonly posts: Pick<PostService, "deletePost"> = postService) {}

  deletePost = async (req: AuthRequest, context: PostRouteContext): Promise<NextResponse> => {
    const parsed = postIdParamsSchema.safeParse(await context.params);
    if (!parsed.success) {
      throw new BadRequestException("Invalid post ID", z.flattenError(parsed.error).fieldErrors);
    }
    await this.posts.deletePost(parsed.data.id, req.userId);
    return new NextResponse(null, { status: 204 });
  };
}

export const postController = new PostController();
