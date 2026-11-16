import { NextResponse } from "next/server";

import { userService, type UserService } from "@/services/user.service";
import type { AuthRequest } from "@/types/auth.types";

export class UserController {
  constructor(private readonly users: Pick<UserService, "getMe"> = userService) {}

  // No Zod schema: #7 reads nothing from the URL or the body. The user comes from the session only.
  getMe = async (req: AuthRequest): Promise<NextResponse> => {
    const me = await this.users.getMe(req.userId);
    // Private: this body carries the email, so no shared cache may store it.
    return NextResponse.json(me, { headers: { "Cache-Control": "private, no-store" } });
  };
}

export const userController = new UserController();
