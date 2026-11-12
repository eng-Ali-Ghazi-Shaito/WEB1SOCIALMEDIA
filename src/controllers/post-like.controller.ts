import { NextResponse } from "next/server";

import { postLikeService, type PostLikeService } from "@/services/post-like.service";
import type { AuthRequest } from "@/types/auth.types";
import type { PostRouteContext } from "@/types/post.types";
import { BadRequestException } from "@/util/exceptions/http/BadRequestException";
import { readJsonBody } from "@/util/readJsonBody";
import { toFieldErrors } from "@/validations/common";
import { postIdParamsSchema, setPostLikeSchema } from "@/validations/post.schema";

export class PostLikeController {
  constructor(private readonly likes: Pick<PostLikeService, "setLike"> = postLikeService) {}

  setLike = async (req: AuthRequest, context: PostRouteContext): Promise<NextResponse> => {
    const params = postIdParamsSchema.safeParse(await context.params);
    if (!params.success) {
      throw new BadRequestException("Invalid post ID", toFieldErrors(params.error));
    }

    const body = setPostLikeSchema.safeParse(await readJsonBody(req));
    if (!body.success) {
      throw new BadRequestException("Invalid request body", toFieldErrors(body.error));
    }

    return NextResponse.json(await this.likes.setLike(params.data.id, req.userId, body.data));
  };
}

export const postLikeController = new PostLikeController();
