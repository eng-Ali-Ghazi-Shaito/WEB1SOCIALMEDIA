import { NextResponse } from "next/server";
import { z } from "zod";

import { feedService, type FeedService } from "@/services/feed.service";
import type { AuthRequest } from "@/types/auth.types";
import { BadRequestException } from "@/util/exceptions/http/BadRequestException";
import { feedQuerySchema } from "@/validations/feed.schema";

export class FeedController {
  constructor(private readonly feed: Pick<FeedService, "getFeed"> = feedService) {}

  getFeed = async (req: AuthRequest): Promise<NextResponse> => {
    const { searchParams } = req.nextUrl;
    if (searchParams.getAll("cursor").length > 1) {
      throw new BadRequestException("Invalid feed query", { cursor: ["Supply only one cursor"] });
    }

    const parsed = feedQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      throw new BadRequestException("Invalid feed query", z.flattenError(parsed.error).fieldErrors);
    }

    const result = await this.feed.getFeed(req.userId, parsed.data);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  };
}

export const feedController = new FeedController();
