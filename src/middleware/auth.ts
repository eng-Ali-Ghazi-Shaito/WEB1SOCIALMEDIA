import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/config/cookie.config";
import { authenticationService } from "@/services/Authentication.service";
import type { AuthRequest } from "@/types/auth.types";
import type { RouteHandler } from "@/types/http.types";
import { AuthenticationFailedException } from "@/util/exceptions/http/AuthenticationException";



//middelware verify token and attaches userID.

// The token comes only from the HttpOnly cookie: one way in means one code path to secure.
function readAccessToken(req: NextRequest): string {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    throw new AuthenticationFailedException();
  }
  return token;
}

//higher-order function: a function that at least receives another function and returns a function.
export function authenticate<Ctx>(

 //handler is the function that handles the api request [POST,GET,DELETE,PATCH..]
  handler: RouteHandler<AuthRequest, Ctx>,


): RouteHandler<NextRequest, Ctx> {
  //the req is the request the rooute recieved including header , body ...
  //context like dynamic route such as  params
    return async (req, context) => {
    const payload = await authenticationService.verifyToken(readAccessToken(req));
    const authRequest = req as AuthRequest;
    authRequest.userId = payload.userId;
    //the handler is like this return postsController.getPosts(authRequest, context);
    return handler(authRequest, context);
  };
}