import { NextResponse } from "next/server";
import { z } from "zod";

import { userService, type UserService } from "@/services/user.service";
import type { AuthRequest } from "@/types/auth.types";
import { BadRequestException } from "@/util/exceptions/http/BadRequestException";
import { userSearchQuerySchema } from "@/validations/user.schema";

export class UserController {
  constructor(
    private readonly users: Pick<UserService, "getMe" | "searchUsers"> = userService,
  ) {}

  // No Zod schema: #7 reads nothing from the URL or the body. The user comes from the session only.
  getMe = async (req: AuthRequest): Promise<NextResponse> => {
    const me = await this.users.getMe(req.userId);
    // Private: this body carries the email, so no shared cache may store it.
    return NextResponse.json(me, { headers: { "Cache-Control": "private, no-store" } });
  };

  search = async (req: AuthRequest): Promise<NextResponse> => {
    const { searchParams } = req.nextUrl;
    // ?q=a&q=b would silently keep the last one, so it is rejected instead.
    if (searchParams.getAll("q").length > 1) {
      throw new BadRequestException("Invalid search query", { q: ["Supply only one q"] });
    }

    const parsed = userSearchQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      throw new BadRequestException("Invalid search query", z.flattenError(parsed.error).fieldErrors);
    }

    const users = await this.users.searchUsers(parsed.data);
    return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } });
  };
}

export const userController = new UserController();
