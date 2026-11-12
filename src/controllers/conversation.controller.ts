import { NextResponse } from "next/server";

import { conversationService, type ConversationService } from "@/services/conversation.service";
import type { AuthRequest } from "@/types/auth.types";
import { BadRequestException } from "@/util/exceptions/http/BadRequestException";
import { toFieldErrors } from "@/validations/common";
import { conversationQuerySchema } from "@/validations/conversation.schema";

export class ConversationController {
  constructor(
    private readonly conversations: Pick<ConversationService, "listConversations"> = conversationService,
  ) {}

  listConversations = async (req: AuthRequest): Promise<NextResponse> => {
    const { searchParams } = req.nextUrl;
    if (searchParams.getAll("cursor").length > 1) {
      throw new BadRequestException("Invalid conversation query", { cursor: ["Supply only one cursor"] });
    }

    const parsed = conversationQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      throw new BadRequestException("Invalid conversation query", toFieldErrors(parsed.error));
    }

    const result = await this.conversations.listConversations(req.userId, parsed.data);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  };
}

export const conversationController = new ConversationController();
