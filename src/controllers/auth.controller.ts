import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, accessTokenCookieOptions } from "@/config/cookie.config";

import {
  authenticationService,
  type AuthenticationService,
} from "@/services/Authentication.service";
import type { AuthRequest } from "@/types/auth.types";
import { BadRequestException } from "@/util/exceptions/http/BadRequestException";
import { loginSchema } from "@/validations/auth.schema";
import { toFieldErrors } from "@/validations/common";

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    //remember the req contains header , body  , cookies , method , url , josn-> the body )
    return await req.json();
  } catch {
    throw new BadRequestException("Request body must be valid JSON");
  }
}

export class AuthController {
  constructor(
    //dependancy injection.
    // authenticationService is the instance from the AuthenticationService.
    //Low coupling: less dependent and makes software easier to maintain, test, and modify.
    private readonly auth: Pick<AuthenticationService, "login" | "logout"> = authenticationService,
  ) {}

  login = async (req: NextRequest): Promise<NextResponse> => {
    const parsed = loginSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      throw new BadRequestException("Invalid request body", toFieldErrors(parsed.error));
    }
    const { accessToken, expiresIn, user } = await this.auth.login(parsed.data);
    const response = NextResponse.json({ user, expiresIn }, { status: 200 });
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions());
    return response  
  };

  logout = async (req: AuthRequest): Promise<NextResponse> => {
    await this.auth.logout(req.userId);
    // Not NextResponse.json: a 204 response must have no body.
    return new NextResponse(null, { status: 204 });
  };
}

export const authController = new AuthController();
